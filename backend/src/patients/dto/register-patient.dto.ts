import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class RegisterPatientDto {
  @ApiProperty({ example: 'paciente@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '001-1234567-8' })
  @IsString()
  documentId: string;

  @ApiProperty({ required: false, example: 'CEDULA' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: 'MALE' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '+1-809-555-1234' })
  @IsString()
  phone: string;
}
