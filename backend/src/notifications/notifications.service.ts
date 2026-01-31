import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CreateNotificationPreferenceDto } from './dto/create-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private whatsappService: WhatsappService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) { }

  // ==================== Notification Preferences ====================

  async getPreferences(userId: string, tenantId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    });

    if (!preferences) {
      preferences = await this.createPreferences({}, userId, tenantId);
    }

    return preferences;
  }

  async createPreferences(
    dto: CreateNotificationPreferenceDto,
    userId: string,
    tenantId: string,
  ) {
    return this.prisma.notificationPreference.create({
      data: {
        userId,
        tenantId,
        ...dto,
      },
    });
  }

  async updatePreferences(
    dto: UpdateNotificationPreferenceDto,
    userId: string,
    tenantId: string,
  ) {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    });

    if (!preferences) {
      throw new NotFoundException('Notification preferences not found');
    }

    return this.prisma.notificationPreference.update({
      where: {
        userId_tenantId: { userId, tenantId },
      },
      data: dto,
    });
  }

  // ==================== Notifications ====================

  async sendNotification(dto: SendNotificationDto, tenantId: string) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        tenantId,
        type: dto.type,
        channel: dto.channel,
        subject: dto.subject,
        message: dto.message,
        metadata: dto.metadata,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
      },
    });

    if (dto.scheduledFor) {
      const delay = new Date(dto.scheduledFor).getTime() - Date.now();
      await this.notificationQueue.add('send-notification', { notificationId: notification.id }, { delay });
      this.logger.log(`Notification ${notification.id} scheduled for ${dto.scheduledFor}`);
    } else {
      await this.notificationQueue.add('send-notification', { notificationId: notification.id });
      this.logger.log(`Notification ${notification.id} queued for immediate sending`);
    }

    return notification;
  }

  async processNotification(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.sent) {
      return;
    }

    const preferences = await this.getPreferences(notification.userId, notification.tenantId);

    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
    });

    if (!user) {
      await this.markNotificationFailed(notificationId, 'User not found');
      return;
    }

    let success = false;

    try {
      if (notification.type === NotificationType.EMAIL && preferences.emailEnabled) {
        success = await this.emailService.sendEmail(
          user.email,
          notification.subject || 'Notificación',
          notification.message,
        );
      } else if (notification.type === NotificationType.WHATSAPP && preferences.whatsappEnabled) {
        if (user.phone) {
          success = await this.whatsappService.sendMessage(
            user.phone,
            notification.message
          );
        } else {
          await this.markNotificationFailed(notificationId, 'User has no phone number');
          return;
        }
      }

      if (success) {
        await this.markNotificationSent(notificationId);
      } else {
        await this.markNotificationFailed(notificationId, 'Failed to send notification');
      }
    } catch (error) {
      this.logger.error(`Error processing notification ${notificationId}:`, error);
      await this.markNotificationFailed(notificationId, error.message);
    }
  }

  async markNotificationSent(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        sent: true,
        sentAt: new Date(),
      },
    });
  }

  async markNotificationFailed(notificationId: string, reason: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        failed: true,
        failureReason: reason,
      },
    });
  }

  async getNotifications(userId: string, tenantId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  async getUnreadCount(userId: string, tenantId: string) {
    // Count notifications that haven't been sent yet (pending) as "unread"
    const count = await this.prisma.notification.count({
      where: {
        userId,
        tenantId,
        sent: false,
        failed: false,
      },
    });

    return { unreadCount: count };
  }

  // ==================== Appointment Reminders ====================

  async scheduleAppointmentReminders(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment || !appointment.patient.userId) {
      return;
    }

    const preferences = await this.getPreferences(
      appointment.patient.userId,
      appointment.tenantId,
    );

    if (!preferences.appointmentReminders) {
      return;
    }

    const dentist = await this.prisma.user.findUnique({
      where: { id: appointment.dentistId },
    });

    for (const hoursBefore of preferences.reminderHoursBefore) {
      const reminderTime = new Date(appointment.appointmentDate);
      reminderTime.setHours(reminderTime.getHours() - hoursBefore);

      if (reminderTime > new Date()) {
        if (reminderTime > new Date()) {
          // Email Notification
          if (preferences.emailEnabled) {
            await this.sendNotification(
              {
                userId: appointment.patient.userId,
                type: NotificationType.EMAIL,
                channel: NotificationChannel.APPOINTMENT_REMINDER,
                subject: 'Recordatorio de Cita',
                message: `Tienes una cita programada en ${hoursBefore} horas`,
                metadata: {
                  appointmentId: appointment.id,
                  appointmentDate: appointment.appointmentDate,
                  dentistName: dentist?.name,
                  procedureType: appointment.procedureType,
                },
                scheduledFor: reminderTime.toISOString(),
              },
              appointment.tenantId,
            );
          }

          // WhatsApp Notification
          if (preferences.whatsappEnabled && preferences.appointmentReminders) {
            await this.sendNotification(
              {
                userId: appointment.patient.userId,
                type: NotificationType.WHATSAPP,
                channel: NotificationChannel.APPOINTMENT_REMINDER,
                subject: 'Recordatorio de Cita',
                message: `Hola ${appointment.patient.firstName}, te recordamos que tienes una cita programada para el ${appointment.appointmentDate.toLocaleDateString()} a las ${appointment.appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Tratamiento: ${appointment.procedureType}.`,
                metadata: {
                  appointmentId: appointment.id,
                  appointmentDate: appointment.appointmentDate,
                  dentistName: dentist?.name,
                  procedureType: appointment.procedureType,
                },
                scheduledFor: reminderTime.toISOString(),
              },
              appointment.tenantId,
            );
          }
        }
      }
    }
  }

  async sendAppointmentConfirmation(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment || !appointment.patient.userId) {
      return;
    }

    const preferences = await this.getPreferences(
      appointment.patient.userId,
      appointment.tenantId,
    );

    if (!preferences.appointmentConfirmation) {
      return;
    }

    const dentist = await this.prisma.user.findUnique({
      where: { id: appointment.dentistId },
    });

    // Email Confirmation
    if (preferences.emailEnabled) {
      await this.sendNotification(
        {
          userId: appointment.patient.userId,
          type: NotificationType.EMAIL,
          channel: NotificationChannel.APPOINTMENT_CONFIRMATION,
          subject: 'Confirmación de Cita',
          message: 'Tu cita ha sido confirmada exitosamente',
          metadata: {
            appointmentId: appointment.id,
            appointmentDate: appointment.appointmentDate,
            dentistName: dentist?.name,
            procedureType: appointment.procedureType,
          },
        },
        appointment.tenantId,
      );
    }

    // WhatsApp Confirmation
    if (preferences.whatsappEnabled && preferences.appointmentConfirmation) {
      await this.sendNotification(
        {
          userId: appointment.patient.userId,
          type: NotificationType.WHATSAPP,
          channel: NotificationChannel.APPOINTMENT_CONFIRMATION,
          subject: 'Confirmación de Cita',
          message: `Hola ${appointment.patient.firstName}, tu cita para el ${appointment.appointmentDate.toLocaleDateString()} a las ${appointment.appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ha sido confirmada.`,
          metadata: {
            appointmentId: appointment.id,
            appointmentDate: appointment.appointmentDate,
            dentistName: dentist?.name,
            procedureType: appointment.procedureType,
          },
        },
        appointment.tenantId,
      );
    }
  }
}
