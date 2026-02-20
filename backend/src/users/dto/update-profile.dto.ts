import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Dr. Juan Pérez' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'juan@medicloud.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1-809-555-1234' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'OldPassword123!' })
  @IsString()
  currentPassword: string;

  @ApiPropertyOptional({ example: 'NewPassword456!' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
