import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateConsultationRoomDto {
  @ApiProperty({ description: 'Clinic ID' })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiProperty({ description: 'Consultation room name', example: 'Room 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Consultation room description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Equipment list',
    required: false,
    example: { chair: 'Dental Chair Model X', xray: 'Digital X-Ray System', tools: ['Drill', 'Scaler'] }
  })
  @IsObject()
  @IsOptional()
  equipment?: any;
}
