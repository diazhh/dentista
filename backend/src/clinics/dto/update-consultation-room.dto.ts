import { PartialType } from '@nestjs/swagger';
import { CreateConsultationRoomDto } from './create-consultation-room.dto';

export class UpdateConsultationRoomDto extends PartialType(CreateConsultationRoomDto) {}
