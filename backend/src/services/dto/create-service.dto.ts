import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service code (e.g., D0120)', example: 'D0120' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ description: 'Service name', example: 'Periodic Oral Evaluation' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Service description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Service category', example: 'Preventive' })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiProperty({ description: 'Default price', example: 75.00 })
  @IsNumber()
  @Min(0)
  defaultPrice: number;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 30, default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  duration?: number;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
