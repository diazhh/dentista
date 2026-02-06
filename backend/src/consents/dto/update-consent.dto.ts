import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DataAccessLevel } from '@prisma/client';

export class UpdateConsentDto {
  @ApiPropertyOptional({ enum: DataAccessLevel, description: 'Updated data access level' })
  @IsEnum(DataAccessLevel)
  @IsOptional()
  dataAccessLevel?: DataAccessLevel;

  @ApiPropertyOptional({ description: 'Share appointments data' })
  @IsBoolean()
  @IsOptional()
  shareAppointments?: boolean;

  @ApiPropertyOptional({ description: 'Share medical history' })
  @IsBoolean()
  @IsOptional()
  shareMedicalHistory?: boolean;

  @ApiPropertyOptional({ description: 'Share documents' })
  @IsBoolean()
  @IsOptional()
  shareDocuments?: boolean;

  @ApiPropertyOptional({ description: 'Share lab results' })
  @IsBoolean()
  @IsOptional()
  shareLabResults?: boolean;

  @ApiPropertyOptional({ description: 'Share billing information' })
  @IsBoolean()
  @IsOptional()
  shareBilling?: boolean;
}
