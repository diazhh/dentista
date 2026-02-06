import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSharedDocumentDto {
  @ApiProperty({ description: 'Document ID to share' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Provider ID to share with' })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
