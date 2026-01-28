import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsDateString } from 'class-validator';
import { NotificationType, NotificationChannel } from '@prisma/client';

export class SendNotificationDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
