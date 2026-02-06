import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MedicalSpecialty } from '@prisma/client';

export class UpdateClinicAdminDto {
  @ApiPropertyOptional({ description: 'Clinic name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Clinic phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Clinic email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Clinic description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Clinic website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Tax identification number' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Business hours as JSON object' })
  @IsOptional()
  @IsObject()
  businessHours?: any;

  @ApiPropertyOptional({
    description: 'Medical specialties offered',
    enum: MedicalSpecialty,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  specialties?: MedicalSpecialty[];

  @ApiPropertyOptional({
    description: 'Clinic amenities',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Whether room rental is enabled' })
  @IsOptional()
  @IsBoolean()
  rentalEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Hourly rental rate' })
  @IsOptional()
  @IsNumber()
  rentalRateHourly?: number;

  @ApiPropertyOptional({ description: 'Daily rental rate' })
  @IsOptional()
  @IsNumber()
  rentalRateDaily?: number;

  @ApiPropertyOptional({ description: 'Monthly rental rate' })
  @IsOptional()
  @IsNumber()
  rentalRateMonthly?: number;

  @ApiPropertyOptional({ description: 'Whether the clinic is publicly listed' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
