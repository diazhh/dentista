import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsInt, IsOptional, IsEnum, IsArray, Min, Max } from 'class-validator';
import { RecurrenceFrequency } from '@prisma/client';

export class CreateRecurringAppointmentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Operatory ID (optional)' })
  @IsString()
  @IsOptional()
  operatoryId?: string;

  @ApiProperty({ enum: RecurrenceFrequency, description: 'Recurrence frequency' })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiProperty({ description: 'Interval (e.g., every 2 weeks)', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  interval?: number;

  @ApiProperty({ description: 'Start date', example: '2025-01-15T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date (optional)', example: '2025-12-31T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

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

  @ApiProperty({ description: 'Time of day (HH:MM)', example: '10:00' })
  @IsString()
  @IsNotEmpty()
  timeOfDay: string;

  @ApiProperty({ 
    description: 'Days of week (0=Sunday, 1=Monday, ..., 6=Saturday)', 
    example: [1, 3, 5],
    type: [Number]
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[];
}
