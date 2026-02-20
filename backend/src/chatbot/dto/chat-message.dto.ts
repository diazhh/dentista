import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class EndSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
