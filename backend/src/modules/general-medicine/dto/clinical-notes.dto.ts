import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClinicalNoteDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({ enum: ['SOAP', 'PROGRESS', 'INITIAL', 'FOLLOW_UP'] })
  @IsOptional()
  @IsString()
  noteType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  vitalSigns?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  diagnoses?: Record<string, any>;
}

export class UpdateClinicalNoteDto {
  @IsOptional() @IsString() noteType?: string;
  @IsOptional() @IsString() subjective?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() assessment?: string;
  @IsOptional() @IsString() plan?: string;
  @IsOptional() @IsObject() vitalSigns?: Record<string, any>;
  @IsOptional() @IsObject() diagnoses?: Record<string, any>;
}
