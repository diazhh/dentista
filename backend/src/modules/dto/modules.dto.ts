import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class ActivateModuleDto {
  @ApiProperty({ required: false, description: 'Optional module configuration overrides' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdateModuleConfigDto {
  @ApiProperty({ description: 'Module configuration object' })
  @IsObject()
  config: Record<string, any>;
}
