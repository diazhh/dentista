import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { NotificationProcessor } from './processors/notification.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    WhatsappModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule { }
