import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsDashboardService } from './patients-dashboard.service';
import { PatientsController } from './patients.controller';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService, PatientsDashboardService],
  exports: [PatientsService],
})
export class PatientsModule {}
