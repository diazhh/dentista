import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ClaimProfileDto {
  @ApiProperty({ example: '001-1234567-8' })
  @IsString()
  documentId: string;

  @ApiProperty({ required: false, example: 'CEDULA' })
  @IsOptional()
  @IsString()
  documentType?: string;
}
