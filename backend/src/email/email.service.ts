import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

  constructor(private prisma: PrismaService) {
    this.initializeTransporter();
  }

  private encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(text: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async initializeTransporter() {
    try {
      const config = await this.prisma.emailConfiguration.findFirst({
        where: { isActive: true },
      });

      if (config) {
        this.transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpSecure,
          auth: {
            user: config.smtpUser,
            pass: this.decrypt(config.smtpPassword),
          },
        });
        this.logger.log('Email transporter initialized successfully');
      } else {
        this.logger.warn('No active email configuration found');
      }
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error);
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    templateId?: string;
  }) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
        if (!this.transporter) {
          throw new Error('Email transporter not configured');
        }
      }

      const config = await this.prisma.emailConfiguration.findFirst({
        where: { isActive: true },
      });

      if (!config) {
        throw new Error('No active email configuration found');
      }

      const info = await this.transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: config.replyToEmail || config.fromEmail,
      });

      // Log email
      await this.prisma.emailLog.create({
        data: {
          templateId: options.templateId,
          to: options.to,
          from: config.fromEmail,
          subject: options.subject,
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            messageId: info.messageId,
          },
        },
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);

      // Log failed email
      await this.prisma.emailLog.create({
        data: {
          templateId: options.templateId,
          to: options.to,
          from: 'system',
          subject: options.subject,
          status: 'failed',
          error: error.message,
        },
      });

      throw error;
    }
  }

  async sendTemplateEmail(templateType: string, to: string, variables: Record<string, any>) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { type: templateType as any },
    });

    if (!template || !template.isActive) {
      throw new Error(`Template ${templateType} not found or inactive`);
    }

    let subject = template.subject;
    let htmlBody = template.htmlBody;
    let textBody = template.textBody || '';

    // Replace variables
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      htmlBody = htmlBody.replace(regex, variables[key]);
      textBody = textBody.replace(regex, variables[key]);
    });

    return this.sendEmail({
      to,
      subject,
      html: htmlBody,
      text: textBody,
      templateId: template.id,
    });
  }

  async testConnection(configId: string, testEmail: string) {
    try {
      const config = await this.prisma.emailConfiguration.findUnique({
        where: { id: configId },
      });

      if (!config) {
        throw new Error('Configuration not found');
      }

      const testTransporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: this.decrypt(config.smtpPassword),
        },
      });

      await testTransporter.verify();

      // Send test email
      await testTransporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: testEmail,
        subject: 'Test Email - DentiCloud',
        html: '<h1>Test Email</h1><p>This is a test email from DentiCloud. If you received this, your SMTP configuration is working correctly!</p>',
      });

      // Update configuration
      await this.prisma.emailConfiguration.update({
        where: { id: configId },
        data: {
          isVerified: true,
          lastTestedAt: new Date(),
          testResult: 'success',
        },
      });

      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      // Update configuration with error
      await this.prisma.emailConfiguration.update({
        where: { id: configId },
        data: {
          isVerified: false,
          lastTestedAt: new Date(),
          testResult: error.message,
        },
      });

      throw error;
    }
  }
}
