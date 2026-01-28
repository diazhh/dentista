import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsObject } from 'class-validator';

export class AssignOperatoryDto {
  @ApiProperty({ description: 'Operatory ID' })
  @IsString()
  @IsNotEmpty()
  operatoryId: string;

  @ApiProperty({ description: 'Dentist ID' })
  @IsString()
  @IsNotEmpty()
  dentistId: string;

  @ApiProperty({ 
    description: 'Schedule configuration',
    example: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' }
    }
  })
  @IsObject()
  @IsNotEmpty()
  schedule: any;

  @ApiProperty({ description: 'Assignment start date', example: '2025-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Assignment end date (optional)', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
