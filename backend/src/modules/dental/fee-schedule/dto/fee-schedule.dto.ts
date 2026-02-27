import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFeeScheduleItemDto {
  @ApiProperty({ description: 'CDT code (e.g., D0120, D2391)' })
  @IsString()
  cdtCode: string;

  @ApiProperty()
  @IsString()
  procedureName: string;

  @ApiProperty({ description: 'DIAGNOSTIC, PREVENTIVE, RESTORATIVE, ENDODONTICS, PERIODONTICS, PROSTHODONTICS, SURGERY, ORTHODONTICS, ADJUNCTIVE' })
  @IsString()
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  fee: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  patientCopay?: number;
}

export class CreateFeeScheduleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({ type: [CreateFeeScheduleItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeeScheduleItemDto)
  items?: CreateFeeScheduleItemDto[];
}

export class UpdateFeeScheduleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() effectiveDate?: string;
  @IsOptional() @IsDateString() expirationDate?: string;
}

export class UpdateFeeScheduleItemDto {
  @IsOptional() @IsString() cdtCode?: string;
  @IsOptional() @IsString() procedureName?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) fee?: number;
  @IsOptional() @IsNumber() @Min(0) insuranceFee?: number;
  @IsOptional() @IsNumber() @Min(0) patientCopay?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
