import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGrowthRecordDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsDateString()
  measurementDate: string;

  @ApiProperty()
  @IsNumber()
  ageMonths: number;

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
  headCircumference?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bmi?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightPercentile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  heightPercentile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  headPercentile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bmiPercentile?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGrowthRecordDto {
  @IsOptional() @IsDateString() measurementDate?: string;
  @IsOptional() @IsNumber() ageMonths?: number;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsNumber() headCircumference?: number;
  @IsOptional() @IsNumber() bmi?: number;
  @IsOptional() @IsNumber() weightPercentile?: number;
  @IsOptional() @IsNumber() heightPercentile?: number;
  @IsOptional() @IsNumber() headPercentile?: number;
  @IsOptional() @IsNumber() bmiPercentile?: number;
  @IsOptional() @IsString() notes?: string;
}
