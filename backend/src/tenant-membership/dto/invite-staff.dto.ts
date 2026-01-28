import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { UserRole } from '@prisma/client';

export class InviteStaffDto {
  @ApiProperty({ description: 'Email of the staff member to invite' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Name of the staff member' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: UserRole, description: 'Role for the staff member' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'Custom permissions (JSON)', required: false })
  @IsObject()
  @IsOptional()
  permissions?: any;
}
