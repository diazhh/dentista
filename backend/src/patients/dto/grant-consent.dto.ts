import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class GrantConsentDto {
  @ApiPropertyOptional({ example: 'FULL', description: 'FULL, CLINICAL_ONLY, SCHEDULING_ONLY, DOCUMENTS_SHARED, MINIMAL' })
  @IsOptional()
  @IsString()
  dataAccessLevel?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  shareAppointments?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shareMedicalHistory?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shareDocuments?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shareLabResults?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shareBilling?: boolean;
}
