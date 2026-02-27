import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProcedureConsentDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({ description: 'EXTRACTION, ROOT_CANAL, IMPLANT, SURGERY, SEDATION, etc.' })
  @IsString()
  procedureType: string;

  @ApiProperty({ description: 'Array of FDI tooth numbers involved', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  toothNumbers: number[];

  @ApiProperty({ description: 'Full consent text to be signed' })
  @IsString()
  consentText: string;

  @ApiProperty({ description: 'List of disclosed risks', type: [String] })
  @IsArray()
  @IsString({ each: true })
  risks: string[];

  @ApiProperty({ description: 'List of alternatives discussed', type: [String] })
  @IsArray()
  @IsString({ each: true })
  alternatives: string[];
}

export class SignConsentDto {
  @ApiProperty({ description: 'Patient signature (base64 or path)' })
  @IsString()
  patientSignature: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  witnessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  witnessSignature?: string;
}
