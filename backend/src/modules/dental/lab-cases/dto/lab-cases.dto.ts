import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsInt,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLabCaseDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty()
  @IsString()
  labName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseNumber?: string;

  @ApiProperty()
  @IsString()
  workType: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  toothNumbers?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specifications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  labFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  patientFee?: number;
}

export class UpdateLabCaseDto {
  @IsOptional() @IsString() patientId?: string;
  @IsOptional() @IsString() appointmentId?: string;
  @IsOptional() @IsString() labName?: string;
  @IsOptional() @IsString() labPhone?: string;
  @IsOptional() @IsString() caseNumber?: string;
  @IsOptional() @IsString() workType?: string;
  @IsOptional() @IsArray() @IsInt({ each: true }) toothNumbers?: number[];
  @IsOptional() @IsString() shade?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() specifications?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsNumber() labFee?: number;
  @IsOptional() @IsNumber() patientFee?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() receivedDate?: string;
  @IsOptional() @IsDateString() seatedDate?: string;
}

const LAB_CASE_STATUSES = [
  'SENT',
  'IN_PROGRESS',
  'RECEIVED',
  'TRIED_IN',
  'SEATED',
  'RETURNED',
  'CANCELLED',
] as const;

export class UpdateLabCaseStatusDto {
  @ApiProperty({
    enum: LAB_CASE_STATUSES,
    description: 'New status for the lab case',
  })
  @IsString()
  @IsIn(LAB_CASE_STATUSES)
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  seatedDate?: string;
}
