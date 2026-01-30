import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsDashboardService } from './patients-dashboard.service';
import { PatientsController } from './patients.controller';
import { PatientsPortalController } from './patients-portal.controller';
import { PatientsPortalService } from './patients-portal.service';

@Module({
  controllers: [PatientsController, PatientsPortalController],
  providers: [PatientsService, PatientsDashboardService, PatientsPortalService],
  exports: [PatientsService],
})
export class PatientsModule { }
