import { Module } from '@nestjs/common';
import { RecurringAppointmentsService } from './recurring-appointments.service';
import { RecurringAppointmentsController } from './recurring-appointments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringAppointmentsController],
  providers: [RecurringAppointmentsService],
  exports: [RecurringAppointmentsService],
})
export class RecurringAppointmentsModule {}
