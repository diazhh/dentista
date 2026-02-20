import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class ShareExamDto {
  @ApiProperty({ description: 'Provider ID to share the exam with' })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({ description: 'Expiration date for temporary sharing (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
