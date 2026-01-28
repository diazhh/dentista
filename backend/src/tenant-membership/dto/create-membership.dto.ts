import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateMembershipDto {
  @ApiProperty({ description: 'User ID to add as staff member' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: UserRole, description: 'Role for the staff member' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'Custom permissions (JSON)', required: false })
  @IsObject()
  @IsOptional()
  permissions?: any;
}
