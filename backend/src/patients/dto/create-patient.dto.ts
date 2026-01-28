import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty()
  @IsString()
  documentId: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ required: false })
  @IsOptional()
  medicalHistory?: any;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  allergies?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  medications?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}
