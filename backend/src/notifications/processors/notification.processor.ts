import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private notificationsService: NotificationsService) {}

  @Process('send-notification')
  async handleSendNotification(job: Job) {
    this.logger.log(`Processing notification job ${job.id}`);
    const { notificationId } = job.data;

    try {
      await this.notificationsService.processNotification(notificationId);
      this.logger.log(`Notification ${notificationId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process notification ${notificationId}:`, error);
      throw error;
    }
  }

  @Process('schedule-appointment-reminders')
  async handleScheduleReminders(job: Job) {
    this.logger.log(`Scheduling reminders for appointment ${job.data.appointmentId}`);
    const { appointmentId } = job.data;

    try {
      await this.notificationsService.scheduleAppointmentReminders(appointmentId);
      this.logger.log(`Reminders scheduled for appointment ${appointmentId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule reminders for appointment ${appointmentId}:`, error);
      throw error;
    }
  }
}
