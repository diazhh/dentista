import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TreatmentPlanStatus } from '@prisma/client';

class CreateTreatmentPlanItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tooth?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  surface?: string;

  @ApiProperty()
  @IsString()
  procedureCode: string;

  @ApiProperty()
  @IsString()
  procedureName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  estimatedCost: number;

  @ApiProperty({ default: 1, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  priority: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTreatmentPlanDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiProperty({ enum: TreatmentPlanStatus, default: TreatmentPlanStatus.DRAFT })
  @IsOptional()
  @IsEnum(TreatmentPlanStatus)
  status?: TreatmentPlanStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateTreatmentPlanItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTreatmentPlanItemDto)
  items: CreateTreatmentPlanItemDto[];
}
