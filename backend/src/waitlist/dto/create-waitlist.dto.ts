import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateWaitlistDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ 
    description: 'Preferred dates for appointment', 
    example: ['2025-01-15T10:00:00Z', '2025-01-16T14:00:00Z'],
    type: [String]
  })
  @IsArray()
  @IsDateString({}, { each: true })
  preferredDates: string[];

  @ApiProperty({ 
    description: 'Preferred times (HH:MM format)', 
    example: ['10:00', '14:00', '16:00'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  preferredTimes: string[];

  @ApiProperty({ description: 'Type of procedure', example: 'Cleaning' })
  @IsString()
  @IsNotEmpty()
  procedureType: string;

  @ApiProperty({ description: 'Duration in minutes', example: 60 })
  @IsInt()
  @Min(15)
  duration: number;

  @ApiProperty({ description: 'Priority level (1-5, 5 being highest)', example: 3, default: 1 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Expiration date (optional)', example: '2025-02-15T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
