import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateInvoiceItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  treatmentPlanId?: string;

  @ApiProperty()
  @IsDateString()
  issueDate: string;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  tax?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
