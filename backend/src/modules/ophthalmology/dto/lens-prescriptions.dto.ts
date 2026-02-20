import { IsString, IsOptional, IsNumber, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLensPrescriptionDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eyeExamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rightSphere?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rightCylinder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rightAxis?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rightAdd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rightPd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leftSphere?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leftCylinder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leftAxis?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leftAdd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  leftPd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prescriptionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coatings?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLensPrescriptionDto {
  @IsOptional() @IsString() eyeExamId?: string;
  @IsOptional() @IsNumber() rightSphere?: number;
  @IsOptional() @IsNumber() rightCylinder?: number;
  @IsOptional() @IsNumber() rightAxis?: number;
  @IsOptional() @IsNumber() rightAdd?: number;
  @IsOptional() @IsNumber() rightPd?: number;
  @IsOptional() @IsNumber() leftSphere?: number;
  @IsOptional() @IsNumber() leftCylinder?: number;
  @IsOptional() @IsNumber() leftAxis?: number;
  @IsOptional() @IsNumber() leftAdd?: number;
  @IsOptional() @IsNumber() leftPd?: number;
  @IsOptional() @IsString() prescriptionType?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) coatings?: string[];
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsString() notes?: string;
}
