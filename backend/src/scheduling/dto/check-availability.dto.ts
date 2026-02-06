import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Provider ID' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ description: 'Date to check (ISO 8601)', example: '2026-02-10' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Service ID (optional, for capability checking and duration)', required: false })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({ description: 'Clinic ID (optional filter)', required: false })
  @IsString()
  @IsOptional()
  clinicId?: string;
}
