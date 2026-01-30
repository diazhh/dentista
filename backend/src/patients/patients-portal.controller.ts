import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientsPortalService } from './patients-portal.service';

@Controller('portal')
@UseGuards(JwtAuthGuard)
export class PatientsPortalController {
    constructor(private readonly portalService: PatientsPortalService) { }

    @Get('dashboard')
    async getDashboard(@Request() req) {
        return this.portalService.getDashboard(req.user.userId);
    }

    @Get('appointments')
    async getAppointments(@Request() req) {
        return this.portalService.getAppointments(req.user.userId);
    }

    @Get('documents')
    async getDocuments(@Request() req) {
        return this.portalService.getDocuments(req.user.userId);
    }
}
