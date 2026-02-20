import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EyeExamsService } from './eye-exams.service';
import { EyeExamsController } from './eye-exams.controller';
import { LensPrescriptionsService } from './lens-prescriptions.service';
import { LensPrescriptionsController } from './lens-prescriptions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EyeExamsController, LensPrescriptionsController],
  providers: [EyeExamsService, LensPrescriptionsService],
  exports: [EyeExamsService, LensPrescriptionsService],
})
export class OphthalmologyModule {}
