import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class ValidateSlotDto {
  @ApiProperty({ description: 'Provider ID' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ description: 'Consultation room ID' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ description: 'Start time (ISO 8601)', example: '2026-02-10T09:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time (ISO 8601)', example: '2026-02-10T09:30:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}
