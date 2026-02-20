import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString() name: string;
  @IsOptional() @IsString() sku?: string;
  @IsString() category: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) currentStock?: number;
  @IsOptional() @IsNumber() @Min(0) minimumStock?: number;
  @IsOptional() @IsNumber() @Min(0) maximumStock?: number;
  @IsOptional() @IsNumber() costPrice?: number;
  @IsOptional() @IsNumber() salePrice?: number;
  @IsOptional() @IsString() supplier?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsDateString() expirationDate?: string;
}

export class UpdateInventoryItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) minimumStock?: number;
  @IsOptional() @IsNumber() @Min(0) maximumStock?: number;
  @IsOptional() @IsNumber() costPrice?: number;
  @IsOptional() @IsNumber() salePrice?: number;
  @IsOptional() @IsString() supplier?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsDateString() expirationDate?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateMovementDto {
  @IsString() itemId: string;
  @IsString() type: string; // IN, OUT, ADJUSTMENT, RETURN, EXPIRED
  @IsNumber() quantity: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() reference?: string;
}
