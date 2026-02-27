import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsInt, IsOptional, IsEnum, Min, Max, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Consultation room ID (optional)' })
  @IsString()
  @IsOptional()
  roomId?: string;

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

export class UpdateAppointmentSoapDto {
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  painScale?: number;

  @IsString()
  @IsOptional()
  subjectiveFindings?: string;

  @IsString()
  @IsOptional()
  objectiveFindings?: string;

  @IsString()
  @IsOptional()
  assessment?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsString()
  @IsOptional()
  postProcedureInstructions?: string;

  @IsString()
  @IsOptional()
  followUpNotes?: string;

  @IsOptional()
  vitalSigns?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  clinicalNoteComplete?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateAppointmentProcedureDto {
  @IsString()
  @IsNotEmpty()
  procedureType: string;

  @IsInt()
  @IsOptional()
  toothNumber?: number;

  @IsArray()
  @IsOptional()
  surfaces?: string[];

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  cdtCode?: string;
}
