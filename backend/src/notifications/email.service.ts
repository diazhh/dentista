import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', '"DentiCloud" <noreply@denticloud.com>'),
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendAppointmentReminder(
    to: string,
    patientName: string,
    appointmentDate: Date,
    dentistName: string,
    procedureType: string,
  ): Promise<boolean> {
    const subject = 'Recordatorio de Cita - DentiCloud';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Recordatorio de Cita</h2>
        <p>Hola ${patientName},</p>
        <p>Este es un recordatorio de tu próxima cita:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Fecha y Hora:</strong> ${appointmentDate.toLocaleString('es-ES', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
          })}</p>
          <p><strong>Doctor:</strong> ${dentistName}</p>
          <p><strong>Procedimiento:</strong> ${procedureType}</p>
        </div>
        <p>Si necesitas cancelar o reprogramar tu cita, por favor contáctanos con al menos 24 horas de anticipación.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Este es un mensaje automático. Por favor no respondas a este correo.
        </p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendAppointmentConfirmation(
    to: string,
    patientName: string,
    appointmentDate: Date,
    dentistName: string,
    procedureType: string,
  ): Promise<boolean> {
    const subject = 'Confirmación de Cita - DentiCloud';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">¡Cita Confirmada!</h2>
        <p>Hola ${patientName},</p>
        <p>Tu cita ha sido confirmada exitosamente:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Fecha y Hora:</strong> ${appointmentDate.toLocaleString('es-ES', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
          })}</p>
          <p><strong>Doctor:</strong> ${dentistName}</p>
          <p><strong>Procedimiento:</strong> ${procedureType}</p>
        </div>
        <p>Te enviaremos un recordatorio antes de tu cita.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Este es un mensaje automático. Por favor no respondas a este correo.
        </p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendWaitlistUpdate(
    to: string,
    patientName: string,
    message: string,
  ): Promise<boolean> {
    const subject = 'Actualización de Lista de Espera - DentiCloud';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Actualización de Lista de Espera</h2>
        <p>Hola ${patientName},</p>
        <p>${message}</p>
        <p>Por favor contáctanos para confirmar tu disponibilidad.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Este es un mensaje automático. Por favor no respondas a este correo.
        </p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }
}
