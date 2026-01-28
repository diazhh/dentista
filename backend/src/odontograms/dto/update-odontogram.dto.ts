import { PartialType } from '@nestjs/swagger';
import { CreateOdontogramDto } from './create-odontogram.dto';

export class UpdateOdontogramDto extends PartialType(CreateOdontogramDto) {}
