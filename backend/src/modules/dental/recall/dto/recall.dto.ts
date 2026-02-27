import { IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDentalRecallDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'PROPHY, PERIO_MAINTENANCE, EXAM, XRAY_BW, XRAY_PANO, FLUORIDE, SEALANT_CHECK' })
  @IsString()
  recallType: string;

  @ApiProperty({ description: 'Interval in months between recalls (e.g., 6 for biannual)' })
  @IsInt()
  @Min(1)
  intervalMonths: number;

  @ApiProperty({ description: 'Next due date' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDentalRecallDto {
  @IsOptional() @IsString() recallType?: string;
  @IsOptional() @IsInt() @Min(1) intervalMonths?: number;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() reminderChannel?: string;
  @IsOptional() @IsString() notes?: string;
}
