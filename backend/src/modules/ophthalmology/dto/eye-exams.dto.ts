import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEyeExamDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visualAcuityRight?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visualAcuityLeft?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  intraocularPressureRight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  intraocularPressureLeft?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pupilResponse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  anteriorSegment?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  posteriorSegment?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  fundoscopy?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colorVision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  peripheralVision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEyeExamDto {
  @IsOptional() @IsString() examType?: string;
  @IsOptional() @IsString() visualAcuityRight?: string;
  @IsOptional() @IsString() visualAcuityLeft?: string;
  @IsOptional() @IsNumber() intraocularPressureRight?: number;
  @IsOptional() @IsNumber() intraocularPressureLeft?: number;
  @IsOptional() @IsString() pupilResponse?: string;
  @IsOptional() @IsObject() anteriorSegment?: Record<string, any>;
  @IsOptional() @IsObject() posteriorSegment?: Record<string, any>;
  @IsOptional() @IsObject() fundoscopy?: Record<string, any>;
  @IsOptional() @IsString() colorVision?: string;
  @IsOptional() @IsString() peripheralVision?: string;
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsString() notes?: string;
}
