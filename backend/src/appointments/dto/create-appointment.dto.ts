import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Operatory ID (optional)' })
  @IsString()
  @IsOptional()
  operatoryId?: string;

  @ApiProperty({ description: 'Appointment date and time', example: '2025-01-15T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @ApiProperty({ description: 'Duration in minutes', example: 60 })
  @IsInt()
  @Min(15)
  duration: number;

  @ApiProperty({ description: 'Type of procedure', example: 'Cleaning' })
  @IsString()
  @IsNotEmpty()
  procedureType: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: AppointmentStatus, default: 'SCHEDULED' })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;
}
