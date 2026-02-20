import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBodyMeasurementDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsDateString()
  measurementDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bmi?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bodyFatPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  muscleMass?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  waistCircumference?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hipCircumference?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  chestCircumference?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  armCircumference?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  thighCircumference?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBodyMeasurementDto {
  @IsOptional() @IsDateString() measurementDate?: string;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsNumber() bmi?: number;
  @IsOptional() @IsNumber() bodyFatPercentage?: number;
  @IsOptional() @IsNumber() muscleMass?: number;
  @IsOptional() @IsNumber() waistCircumference?: number;
  @IsOptional() @IsNumber() hipCircumference?: number;
  @IsOptional() @IsNumber() chestCircumference?: number;
  @IsOptional() @IsNumber() armCircumference?: number;
  @IsOptional() @IsNumber() thighCircumference?: number;
  @IsOptional() @IsString() notes?: string;
}
