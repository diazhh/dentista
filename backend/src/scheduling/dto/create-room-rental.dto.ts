import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateRoomRentalDto {
  @ApiProperty({ description: 'Consultation room ID' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({
    description: 'Weekly schedule as JSON: { monday: [{start: "09:00", end: "13:00"}], ... }',
    example: { monday: [{ start: '09:00', end: '13:00' }], wednesday: [{ start: '14:00', end: '18:00' }] },
  })
  @IsObject()
  @IsNotEmpty()
  schedule: Record<string, { start: string; end: string }[]>;

  @ApiProperty({ description: 'Start date of the rental (ISO 8601)', example: '2026-03-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date of the rental (ISO 8601, optional for ongoing)', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Assignment type',
    enum: ['RECURRING', 'ONE_TIME', 'RENTAL'],
    default: 'RENTAL',
  })
  @IsString()
  @IsOptional()
  assignmentType?: string;

  @ApiProperty({ description: 'Rental rate (per period)', required: false })
  @IsNumber()
  @IsOptional()
  rentalRate?: number;

  @ApiProperty({ description: 'Rental period (HOURLY, DAILY, WEEKLY, MONTHLY)', required: false })
  @IsString()
  @IsOptional()
  rentalPeriod?: string;
}
