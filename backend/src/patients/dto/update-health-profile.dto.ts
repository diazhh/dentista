import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateHealthProfileDto {
  @ApiPropertyOptional({ example: 'O+' })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional({ example: ['Penicilina', 'Ibuprofeno'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ example: ['Metformina 500mg', 'Losartán 50mg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiPropertyOptional({ example: ['Diabetes tipo 2', 'Hipertensión'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @ApiPropertyOptional({ example: 'María Pérez' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+1-809-555-9876' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: 'Esposa' })
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;
}
