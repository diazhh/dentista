import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClinicStaffDto {
  @ApiProperty({ description: 'User ID of the staff member' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Role of the staff member within the clinic',
    enum: ['RECEPTIONIST', 'ADMIN', 'MAINTENANCE'],
  })
  @IsString()
  @IsIn(['RECEPTIONIST', 'ADMIN', 'MAINTENANCE'])
  role: string;
}
