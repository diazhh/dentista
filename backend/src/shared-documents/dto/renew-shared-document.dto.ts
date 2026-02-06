import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewSharedDocumentDto {
  @ApiProperty({ description: 'New expiration date (ISO 8601)' })
  @IsDateString()
  expiresAt: string;
}
