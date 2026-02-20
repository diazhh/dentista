import { IsString, IsOptional, IsInt, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTherapySessionDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({ enum: ['INDIVIDUAL', 'COUPLE', 'FAMILY', 'GROUP'] })
  @IsOptional()
  @IsString()
  sessionType?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  techniques?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homework?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  progress?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodRating?: number;

  @ApiPropertyOptional({ enum: ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'] })
  @IsOptional()
  @IsString()
  riskLevel?: string;
}

export class UpdateTherapySessionDto {
  @IsOptional() @IsString() sessionType?: string;
  @IsOptional() @IsInt() duration?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() techniques?: string[];
  @IsOptional() @IsString() homework?: string;
  @IsOptional() @IsString() progress?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10) moodRating?: number;
  @IsOptional() @IsString() riskLevel?: string;
}
