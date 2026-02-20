import { IsString, IsOptional, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExercisePlanDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsObject()
  exercises: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frequency?: string;

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

export class UpdateExercisePlanDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsObject() exercises?: Record<string, any>;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsObject() progress?: Record<string, any>;
  @IsOptional() @IsString() notes?: string;
}
