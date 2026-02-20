import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFunctionalAssessmentDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rangeOfMotion?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  painScale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  functionalScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  mobility?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  strength?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  balance?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  goals?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFunctionalAssessmentDto {
  @IsOptional() @IsString() assessmentType?: string;
  @IsOptional() @IsObject() rangeOfMotion?: Record<string, any>;
  @IsOptional() @IsNumber() painScale?: number;
  @IsOptional() @IsNumber() functionalScore?: number;
  @IsOptional() @IsObject() mobility?: Record<string, any>;
  @IsOptional() @IsObject() strength?: Record<string, any>;
  @IsOptional() @IsObject() balance?: Record<string, any>;
  @IsOptional() @IsObject() goals?: Record<string, any>;
  @IsOptional() @IsString() notes?: string;
}
