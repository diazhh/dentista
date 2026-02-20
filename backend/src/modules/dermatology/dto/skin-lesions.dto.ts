import { IsString, IsOptional, IsObject, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkinLesionDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  bodyLocation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationDetails?: string;

  @ApiProperty()
  @IsString()
  lesionType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  size?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shape?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  borders?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  texture?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  differentialDiagnosis?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  biopsyRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  biopsyDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  biopsyResult?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  images?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSkinLesionDto {
  @IsOptional() @IsString() bodyLocation?: string;
  @IsOptional() @IsString() locationDetails?: string;
  @IsOptional() @IsString() lesionType?: string;
  @IsOptional() @IsObject() size?: Record<string, any>;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() shape?: string;
  @IsOptional() @IsString() borders?: string;
  @IsOptional() @IsString() texture?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) symptoms?: string[];
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) differentialDiagnosis?: string[];
  @IsOptional() @IsBoolean() biopsyRequired?: boolean;
  @IsOptional() @IsDateString() biopsyDate?: string;
  @IsOptional() @IsString() biopsyResult?: string;
  @IsOptional() @IsObject() images?: Record<string, any>;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() followUpDate?: string;
  @IsOptional() @IsString() notes?: string;
}
