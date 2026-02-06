import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

const STAFF_ROLES = [
  UserRole.STAFF_MANAGER,
  UserRole.STAFF_RECEPTIONIST,
  UserRole.STAFF_BILLING,
  UserRole.STAFF_ASSISTANT,
] as const;

export class StaffPermissionsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  patients?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  appointments?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    cancel: boolean;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  billing?: {
    view: boolean;
    create: boolean;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  clinical?: {
    viewNotes: boolean;
    viewDocuments: boolean;
  };
}

export class InviteStaffDto {
  @ApiProperty({ description: 'Email of the staff member to invite' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Name of the staff member' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: STAFF_ROLES,
    description: 'Role: STAFF_MANAGER, STAFF_RECEPTIONIST, STAFF_BILLING, STAFF_ASSISTANT',
  })
  @IsEnum(UserRole, {
    message: `Role must be one of: ${STAFF_ROLES.join(', ')}`,
  })
  role: UserRole;

  @ApiProperty({ description: 'Granular permissions', required: false, type: StaffPermissionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StaffPermissionsDto)
  permissions?: StaffPermissionsDto;
}
