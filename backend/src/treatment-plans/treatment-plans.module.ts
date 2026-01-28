import { Module } from '@nestjs/common';
import { TreatmentPlansService } from './treatment-plans.service';
import { TreatmentPlansController } from './treatment-plans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TreatmentPlansController],
  providers: [TreatmentPlansService],
  exports: [TreatmentPlansService],
})
export class TreatmentPlansModule {}
