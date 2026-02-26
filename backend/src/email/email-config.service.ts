import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../admin/audit-log.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailConfigService {
  private encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private deriveKey(): Buffer {
    return crypto.scryptSync(this.encryptionKey, 'medicloud-salt', 32);
  }

  private encrypt(text: string): string {
    const key = this.deriveKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const key = this.deriveKey();
    const [ivHex, encrypted] = text.split(':');
    if (!ivHex || !encrypted) {
      // Fallback for legacy data encrypted without IV
      const legacyDecipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = legacyDecipher.update(text, 'hex', 'utf8');
      decrypted += legacyDecipher.final('utf8');
      return decrypted;
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async getActiveConfig() {
    const config = await this.prisma.emailConfiguration.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return null;
    }

    // Don't expose password
    const { smtpPassword, ...safeConfig } = config;
    return {
      ...safeConfig,
      smtpPassword: '********',
    };
  }

  async getAllConfigs() {
    const configs = await this.prisma.emailConfiguration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return configs.map(config => {
      const { smtpPassword, ...safeConfig } = config;
      return {
        ...safeConfig,
        smtpPassword: '********',
      };
    });
  }

  async getConfigById(id: string) {
    const config = await this.prisma.emailConfiguration.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    const { smtpPassword, ...safeConfig } = config;
    return {
      ...safeConfig,
      smtpPassword: '********',
    };
  }

  async createConfig(data: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
  }, userId: string) {
    // Deactivate all other configs if this is being set as active
    await this.prisma.emailConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const config = await this.prisma.emailConfiguration.create({
      data: {
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpUser: data.smtpUser,
        smtpPassword: this.encrypt(data.smtpPassword),
        smtpSecure: data.smtpSecure,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        replyToEmail: data.replyToEmail,
        isActive: true,
      },
    });

    await this.auditLogService.create({
      userId,
      action: 'CREATE',
      entity: 'EmailConfiguration',
      entityId: config.id,
      metadata: {
        smtpHost: data.smtpHost,
        fromEmail: data.fromEmail,
      },
    });

    const { smtpPassword, ...safeConfig } = config;
    return {
      ...safeConfig,
      smtpPassword: '********',
    };
  }

  async updateConfig(id: string, data: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    smtpSecure?: boolean;
    fromEmail?: string;
    fromName?: string;
    replyToEmail?: string;
  }, userId: string) {
    const config = await this.prisma.emailConfiguration.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    const updateData: any = { ...data };
    if (data.smtpPassword && data.smtpPassword !== '********') {
      updateData.smtpPassword = this.encrypt(data.smtpPassword);
    } else {
      delete updateData.smtpPassword;
    }

    const updated = await this.prisma.emailConfiguration.update({
      where: { id },
      data: updateData,
    });

    await this.auditLogService.create({
      userId,
      action: 'UPDATE',
      entity: 'EmailConfiguration',
      entityId: id,
      metadata: {
        changes: data,
      },
    });

    const { smtpPassword, ...safeConfig } = updated;
    return {
      ...safeConfig,
      smtpPassword: '********',
    };
  }

  async deleteConfig(id: string, userId: string) {
    const config = await this.prisma.emailConfiguration.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Email configuration not found');
    }

    await this.prisma.emailConfiguration.delete({
      where: { id },
    });

    await this.auditLogService.create({
      userId,
      action: 'DELETE',
      entity: 'EmailConfiguration',
      entityId: id,
      metadata: {
        smtpHost: config.smtpHost,
      },
    });

    return { message: 'Email configuration deleted successfully' };
  }

  async activateConfig(id: string, userId: string) {
    // Deactivate all configs
    await this.prisma.emailConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate this one
    const config = await this.prisma.emailConfiguration.update({
      where: { id },
      data: { isActive: true },
    });

    await this.auditLogService.create({
      userId,
      action: 'UPDATE',
      entity: 'EmailConfiguration',
      entityId: id,
      metadata: {
        action: 'activated',
      },
    });

    const { smtpPassword, ...safeConfig } = config;
    return {
      ...safeConfig,
      smtpPassword: '********',
    };
  }
}
