import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsArray, IsInt, Min } from 'class-validator';

export class CreateNotificationPreferenceDto {
  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  appointmentReminders?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  appointmentConfirmation?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  waitlistUpdates?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  paymentReminders?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiProperty({ type: [Number], default: [24, 2], description: 'Hours before appointment to send reminders' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  reminderHoursBefore?: number[];
}
