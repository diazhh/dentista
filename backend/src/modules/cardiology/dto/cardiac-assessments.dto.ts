import { IsString, IsOptional, IsObject, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCardiacAssessmentDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bloodPressureSystolic?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bloodPressureDiastolic?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rhythm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ecgFindings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  echoFindings?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  lipidPanel?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  medications?: Record<string, any>;

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
  @IsString()
  notes?: string;
}

export class UpdateCardiacAssessmentDto {
  @IsOptional() @IsString() assessmentType?: string;
  @IsOptional() @IsNumber() bloodPressureSystolic?: number;
  @IsOptional() @IsNumber() bloodPressureDiastolic?: number;
  @IsOptional() @IsNumber() heartRate?: number;
  @IsOptional() @IsString() rhythm?: string;
  @IsOptional() @IsString() ecgFindings?: string;
  @IsOptional() @IsObject() echoFindings?: Record<string, any>;
  @IsOptional() @IsObject() lipidPanel?: Record<string, any>;
  @IsOptional() @IsArray() @IsString({ each: true }) riskFactors?: string[];
  @IsOptional() @IsNumber() riskScore?: number;
  @IsOptional() @IsObject() medications?: Record<string, any>;
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsString() plan?: string;
  @IsOptional() @IsString() notes?: string;
}
