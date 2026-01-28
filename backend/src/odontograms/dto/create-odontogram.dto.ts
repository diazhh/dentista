import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ToothCondition, ToothSurface } from '@prisma/client';

export class CreateToothDto {
  @ApiProperty({ description: 'Tooth number (1-32 for adults, 51-85 for children)' })
  @IsInt()
  @Min(1)
  @Max(85)
  toothNumber: number;

  @ApiProperty({ enum: ToothCondition })
  @IsEnum(ToothCondition)
  condition: ToothCondition;

  @ApiProperty({ enum: ToothSurface, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(ToothSurface, { each: true })
  surfaces?: ToothSurface[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Hex color for visualization' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateOdontogramDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateToothDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateToothDto)
  teeth?: CreateToothDto[];
}
