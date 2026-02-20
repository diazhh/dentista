import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClinicalNotesService } from './clinical-notes.service';
import { ClinicalNotesController } from './clinical-notes.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicalNotesController, PrescriptionsController],
  providers: [ClinicalNotesService, PrescriptionsService],
  exports: [ClinicalNotesService, PrescriptionsService],
})
export class GeneralMedicineModule {}
