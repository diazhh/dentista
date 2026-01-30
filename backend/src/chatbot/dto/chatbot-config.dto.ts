import { IsBoolean, IsString, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateChatbotConfigDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @IsString()
  @IsOptional()
  fallbackMessage?: string;

  @IsString()
  @IsOptional()
  clinicName?: string;

  @IsString()
  @IsOptional()
  clinicAddress?: string;

  @IsString()
  @IsOptional()
  clinicPhone?: string;

  @IsString()
  @IsOptional()
  clinicWebsite?: string;

  @IsOptional()
  operatingHours?: Record<string, { open: string; close: string }>;

  @IsOptional()
  pricingInfo?: Array<{ service: string; price: number; description?: string }>;

  @IsString()
  @IsOptional()
  aiModel?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  aiTemperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(1000)
  maxTokens?: number;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsBoolean()
  @IsOptional()
  allowScheduling?: boolean;

  @IsBoolean()
  @IsOptional()
  allowCancellation?: boolean;

  @IsBoolean()
  @IsOptional()
  allowRescheduling?: boolean;

  @IsBoolean()
  @IsOptional()
  requireIdentification?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10000)
  autoResponseDelay?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  humanHandoffKeywords?: string[];

  @IsNumber()
  @IsOptional()
  @Min(10)
  @Max(1000)
  maxMessagesPerHour?: number;
}

export class UpdateChatbotConfigDto extends CreateChatbotConfigDto {}
