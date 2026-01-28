import { PartialType } from '@nestjs/swagger';
import { CreateRecurringAppointmentDto } from './create-recurring-appointment.dto';

export class UpdateRecurringAppointmentDto extends PartialType(CreateRecurringAppointmentDto) {}
