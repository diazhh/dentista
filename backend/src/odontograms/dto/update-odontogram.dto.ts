import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray } from 'class-validator';
import { ToothCondition, ToothSurface } from '@prisma/client';
import { CreateOdontogramDto } from './create-odontogram.dto';

export class UpdateOdontogramDto extends PartialType(CreateOdontogramDto) {}

export class UpdateFromProcedureDto {
  @ApiProperty({ description: 'Tooth number (FDI notation)' })
  @IsInt()
  @Min(1)
  @Max(85)
  toothNumber: number;

  @ApiProperty({ enum: ToothCondition })
  @IsEnum(ToothCondition)
  newCondition: ToothCondition;

  @ApiProperty({ enum: ToothSurface, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(ToothSurface, { each: true })
  surfaces?: ToothSurface[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
