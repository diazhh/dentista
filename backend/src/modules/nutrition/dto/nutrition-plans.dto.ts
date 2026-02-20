import { IsString, IsOptional, IsNumber, IsDateString, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNutritionPlanDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dailyCalories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  macros?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  meals?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supplements?: string[];

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateNutritionPlanDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsNumber() dailyCalories?: number;
  @IsOptional() @IsObject() macros?: Record<string, any>;
  @IsOptional() @IsObject() meals?: Record<string, any>;
  @IsOptional() @IsArray() @IsString({ each: true }) restrictions?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) supplements?: string[];
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
}
