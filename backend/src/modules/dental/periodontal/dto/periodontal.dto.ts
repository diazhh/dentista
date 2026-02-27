import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePeriodontalReadingDto {
  @ApiProperty({ description: 'FDI tooth number (11-48)' })
  @IsInt()
  toothNumber: number;

  @ApiProperty({ description: 'Pocket depth buccal [MB, B, DB] in mm', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  pocketDepthBuccal: number[];

  @ApiProperty({ description: 'Gingival margin buccal [MB, B, DB] negative=recession', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  gingivalMarginBuccal: number[];

  @ApiProperty({ description: 'Bleeding on probing buccal [MB, B, DB]', type: [Boolean] })
  @IsArray()
  @IsBoolean({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  bleedingBuccal: boolean[];

  @ApiProperty({ description: 'Pocket depth lingual [ML, L, DL] in mm', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  pocketDepthLingual: number[];

  @ApiProperty({ description: 'Gingival margin lingual [ML, L, DL] negative=recession', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  gingivalMarginLingual: number[];

  @ApiProperty({ description: 'Bleeding on probing lingual [ML, L, DL]', type: [Boolean] })
  @IsArray()
  @IsBoolean({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  bleedingLingual: boolean[];

  @ApiPropertyOptional({ description: 'Plaque present' })
  @IsOptional()
  @IsBoolean()
  plaque?: boolean;

  @ApiPropertyOptional({ description: 'Calculus present' })
  @IsOptional()
  @IsBoolean()
  calculus?: boolean;

  @ApiPropertyOptional({ description: 'Suppuration present' })
  @IsOptional()
  @IsBoolean()
  suppuration?: boolean;

  @ApiPropertyOptional({ description: 'Furcation grade 0-3' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  furcation?: number;

  @ApiPropertyOptional({ description: 'Mobility grade 0-3' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  mobility?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePeriodontalExamDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ description: 'COMPREHENSIVE | LIMITED | MAINTENANCE' })
  @IsOptional()
  @IsString()
  examType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'HEALTHY | GINGIVITIS | MILD_PERIODONTITIS | MODERATE_PERIODONTITIS | SEVERE_PERIODONTITIS' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Overall plaque percentage 0-100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overallPlaque?: number;

  @ApiPropertyOptional({ description: 'Overall bleeding percentage 0-100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overallBleeding?: number;

  @ApiPropertyOptional({ description: 'Array of tooth readings', type: [CreatePeriodontalReadingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePeriodontalReadingDto)
  readings?: CreatePeriodontalReadingDto[];
}

export class UpdatePeriodontalExamDto {
  @IsOptional() @IsString() examType?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) overallPlaque?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) overallBleeding?: number;
}
