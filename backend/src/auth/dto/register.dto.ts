import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsArray } from 'class-validator';
import { UserRole, MedicalSpecialty } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PROVIDER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  npiNumber?: string;

  @ApiProperty({
    enum: MedicalSpecialty,
    isArray: true,
    required: false,
    example: [MedicalSpecialty.GENERAL_MEDICINE],
    description: 'Array of medical specialties for providers',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MedicalSpecialty, { each: true })
  specialties?: MedicalSpecialty[];

  @ApiProperty({ required: false, example: 'Experienced healthcare provider with 10+ years of practice.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, default: 'es', example: 'es' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false, default: 'America/Santo_Domingo', example: 'America/Santo_Domingo' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
