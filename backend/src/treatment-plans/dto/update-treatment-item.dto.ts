import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TreatmentItemStatus } from '@prisma/client';

export class UpdateTreatmentItemDto {
  @ApiProperty({ enum: TreatmentItemStatus })
  @IsOptional()
  @IsEnum(TreatmentItemStatus)
  status?: TreatmentItemStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  actualCost?: number;
}
