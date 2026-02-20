import { IsString, IsOptional, IsNumber, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGynecologicalExamDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ default: 'ROUTINE' })
  @IsOptional()
  @IsString()
  examType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastMenstrualPeriod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  menstrualCycleLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  menstrualRegularity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contraceptiveMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  pregnancyHistory?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  currentPregnancy?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  examFindings?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  papSmearResult?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  ultrasoundFindings?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  labResults?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextAppointmentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGynecologicalExamDto {
  @IsOptional() @IsString() examType?: string;
  @IsOptional() @IsDateString() lastMenstrualPeriod?: string;
  @IsOptional() @IsNumber() menstrualCycleLength?: number;
  @IsOptional() @IsString() menstrualRegularity?: string;
  @IsOptional() @IsString() contraceptiveMethod?: string;
  @IsOptional() @IsObject() pregnancyHistory?: Record<string, any>;
  @IsOptional() @IsObject() currentPregnancy?: Record<string, any>;
  @IsOptional() @IsObject() examFindings?: Record<string, any>;
  @IsOptional() @IsString() papSmearResult?: string;
  @IsOptional() @IsObject() ultrasoundFindings?: Record<string, any>;
  @IsOptional() @IsObject() labResults?: Record<string, any>;
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsString() plan?: string;
  @IsOptional() @IsDateString() nextAppointmentDate?: string;
  @IsOptional() @IsString() notes?: string;
}
