import { IsString, IsOptional, IsInt, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDentalImageDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({ description: 'PERIAPICAL, BITEWING, PANORAMIC, CEPHALOMETRIC, CBCT, INTRAORAL_PHOTO, EXTRAORAL_PHOTO' })
  @IsString()
  imageType: string;

  @ApiPropertyOptional({ description: 'FDI tooth number, null for panoramic/full-mouth' })
  @IsOptional()
  @IsInt()
  toothNumber?: number;

  @ApiPropertyOptional({ description: 'UPPER_RIGHT, UPPER_LEFT, LOWER_RIGHT, LOWER_LEFT, FULL_MOUTH, ANTERIOR, POSTERIOR' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsString()
  filePath: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  takenDate?: string;
}

export class UpdateDentalImageDto {
  @IsOptional() @IsString() appointmentId?: string;
  @IsOptional() @IsString() imageType?: string;
  @IsOptional() @IsInt() toothNumber?: number;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() fileName?: string;
  @IsOptional() @IsString() filePath?: string;
  @IsOptional() @IsNumber() fileSize?: number;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() findings?: string;
  @IsOptional() @IsDateString() takenDate?: string;
}
