import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { FeeScheduleService } from './fee-schedule.service';
import { FeeScheduleController } from './fee-schedule.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FeeScheduleController],
  providers: [FeeScheduleService],
  exports: [FeeScheduleService],
})
export class FeeScheduleModule {}
