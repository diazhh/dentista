import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ContactWaitlistDto {
  @ApiProperty({ description: 'Notes about the contact', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
