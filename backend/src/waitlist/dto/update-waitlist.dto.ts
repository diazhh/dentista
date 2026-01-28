import { PartialType } from '@nestjs/swagger';
import { CreateWaitlistDto } from './create-waitlist.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { WaitlistStatus } from '@prisma/client';

export class UpdateWaitlistDto extends PartialType(CreateWaitlistDto) {
  @ApiProperty({ enum: WaitlistStatus, description: 'Waitlist status', required: false })
  @IsEnum(WaitlistStatus)
  @IsOptional()
  status?: WaitlistStatus;
}
