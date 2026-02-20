import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVaccinationRecordDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  vaccineName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vaccineType?: string;

  @ApiProperty()
  @IsNumber()
  doseNumber: number;

  @ApiProperty()
  @IsDateString()
  administeredDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextDoseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  site?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adverseReaction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVaccinationRecordDto {
  @IsOptional() @IsString() vaccineName?: string;
  @IsOptional() @IsString() vaccineType?: string;
  @IsOptional() @IsNumber() doseNumber?: number;
  @IsOptional() @IsDateString() administeredDate?: string;
  @IsOptional() @IsDateString() nextDoseDate?: string;
  @IsOptional() @IsString() batchNumber?: string;
  @IsOptional() @IsString() site?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() manufacturer?: string;
  @IsOptional() @IsString() adverseReaction?: string;
  @IsOptional() @IsString() notes?: string;
}
