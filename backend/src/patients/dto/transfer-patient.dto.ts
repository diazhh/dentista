import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TransferPatientDto {
  @ApiProperty({ description: 'ID of the new provider to transfer the patient to' })
  @IsUUID()
  newProviderId: string;
}
