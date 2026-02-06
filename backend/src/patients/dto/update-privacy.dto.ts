import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DataAccessLevel } from '@prisma/client';

export class UpdatePrivacyDto {
  @ApiProperty({ enum: DataAccessLevel, example: 'MINIMAL' })
  @IsEnum(DataAccessLevel)
  defaultDataAccess: DataAccessLevel;
}
