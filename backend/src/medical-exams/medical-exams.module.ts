import { Module } from '@nestjs/common';
import { MedicalExamsController } from './medical-exams.controller';
import { MedicalExamsService } from './medical-exams.service';

@Module({
  controllers: [MedicalExamsController],
  providers: [MedicalExamsService],
  exports: [MedicalExamsService],
})
export class MedicalExamsModule { }
