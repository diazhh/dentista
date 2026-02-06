import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClinicStaffDto {
  @ApiPropertyOptional({
    description: 'Role of the staff member within the clinic',
    enum: ['RECEPTIONIST', 'ADMIN', 'MAINTENANCE'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['RECEPTIONIST', 'ADMIN', 'MAINTENANCE'])
  role?: string;

  @ApiPropertyOptional({ description: 'Whether the staff member is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
