import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateMedicalExamDto {
  @ApiProperty({ example: 'Radiografia de torax' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'RADIOGRAFIA' })
  @IsString()
  examType: string;

  @ApiProperty({ required: false, example: 'Radiografia frontal de torax' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  examDate: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
