import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchPatientDto {
  @ApiProperty({ required: false, description: 'Search by document ID (cédula)' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiProperty({ required: false, description: 'Search by first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false, description: 'Search by last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, description: 'Search by phone' })
  @IsOptional()
  @IsString()
  phone?: string;
}
