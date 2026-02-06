import { IsString, IsEnum, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataAccessLevel } from '@prisma/client';

export class RequestConsentDto {
  @ApiProperty({ description: 'Patient ID to request consent from' })
  @IsString()
  patientId: string;

  @ApiProperty({ enum: DataAccessLevel, description: 'Requested data access level' })
  @IsEnum(DataAccessLevel)
  dataAccessLevel: DataAccessLevel;

  @ApiPropertyOptional({ description: 'Share appointments data', default: true })
  @IsBoolean()
  @IsOptional()
  shareAppointments?: boolean;

  @ApiPropertyOptional({ description: 'Share medical history', default: false })
  @IsBoolean()
  @IsOptional()
  shareMedicalHistory?: boolean;

  @ApiPropertyOptional({ description: 'Share documents', default: false })
  @IsBoolean()
  @IsOptional()
  shareDocuments?: boolean;

  @ApiPropertyOptional({ description: 'Share lab results', default: false })
  @IsBoolean()
  @IsOptional()
  shareLabResults?: boolean;

  @ApiPropertyOptional({ description: 'Share billing information', default: false })
  @IsBoolean()
  @IsOptional()
  shareBilling?: boolean;

  @ApiPropertyOptional({ description: 'Reason for requesting consent' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Consent expiration date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
