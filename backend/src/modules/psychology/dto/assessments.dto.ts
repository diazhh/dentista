import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssessmentDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Assessment type (e.g. PHQ9, GAD7, BECK_DEPRESSION, CUSTOM)' })
  @IsString()
  assessmentType: string;

  @ApiProperty({ description: 'JSON object with item responses (e.g. { "q1": 2, "q2": 1, ... })' })
  @IsObject()
  responses: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interpretation?: string;
}
