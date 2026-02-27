import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto, UpdateAppointmentSoapDto, CreateAppointmentProcedureDto } from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}

export { UpdateAppointmentSoapDto, CreateAppointmentProcedureDto };
