import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    UseGuards,
    Request,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientsPortalService } from './patients-portal.service';

@Controller('portal')
@UseGuards(JwtAuthGuard)
export class PatientsPortalController {
    constructor(private readonly portalService: PatientsPortalService) { }

    // ==========================================
    // Dashboard
    // ==========================================

    @Get('dashboard')
    async getDashboard(@Request() req) {
        return this.portalService.getDashboard(req.user.userId);
    }

    // ==========================================
    // Appointments
    // ==========================================

    @Get('appointments')
    async getAppointments(@Request() req) {
        return this.portalService.getAppointments(req.user.userId);
    }

    // ==========================================
    // Documents
    // ==========================================

    @Get('documents')
    async getDocuments(@Request() req) {
        return this.portalService.getDocuments(req.user.userId);
    }

    // ==========================================
    // Treatment Plans
    // ==========================================

    @Get('treatment-plans')
    async getTreatmentPlans(@Request() req) {
        return this.portalService.getTreatmentPlans(req.user.userId);
    }

    @Get('treatment-plans/:id')
    async getTreatmentPlanById(@Request() req, @Param('id') id: string) {
        return this.portalService.getTreatmentPlanById(req.user.userId, id);
    }

    @Post('treatment-plans/:id/accept')
    async acceptTreatmentPlan(@Request() req, @Param('id') id: string) {
        return this.portalService.acceptTreatmentPlan(req.user.userId, id);
    }

    @Post('treatment-plans/:id/reject')
    async rejectTreatmentPlan(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { reason?: string }
    ) {
        return this.portalService.rejectTreatmentPlan(req.user.userId, id, body.reason);
    }

    // ==========================================
    // Payments
    // ==========================================

    @Get('payments')
    async getPayments(@Request() req) {
        return this.portalService.getPayments(req.user.userId);
    }

    @Get('payments/summary')
    async getPaymentsSummary(@Request() req) {
        return this.portalService.getPaymentsSummary(req.user.userId);
    }

    // ==========================================
    // Invoices
    // ==========================================

    @Get('invoices')
    async getInvoices(@Request() req) {
        return this.portalService.getInvoices(req.user.userId);
    }

    @Get('invoices/:id')
    async getInvoiceById(@Request() req, @Param('id') id: string) {
        return this.portalService.getInvoiceById(req.user.userId, id);
    }

    // ==========================================
    // Pre-Visit Forms
    // ==========================================

    @Get('pre-visit-forms')
    async getPreVisitForms(@Request() req) {
        return this.portalService.getPreVisitForms(req.user.userId);
    }

    @Get('appointments/:appointmentId/pre-visit-form')
    async getPreVisitFormForAppointment(
        @Request() req,
        @Param('appointmentId') appointmentId: string
    ) {
        return this.portalService.getPreVisitFormForAppointment(req.user.userId, appointmentId);
    }

    @Post('appointments/:appointmentId/pre-visit-form')
    async submitPreVisitForm(
        @Request() req,
        @Param('appointmentId') appointmentId: string,
        @Body() data: {
            currentMedications?: string[];
            allergiesUpdate?: string[];
            medicalConditions?: string[];
            recentSurgeries?: string;
            chiefComplaint?: string;
            painLevel?: number;
            painLocation?: string;
            symptomsDuration?: string;
            lastDentalVisit?: Date;
            brushingFrequency?: string;
            flossingFrequency?: string;
            hasInsuranceChanges?: boolean;
            insuranceProvider?: string;
            insurancePolicyNumber?: string;
            insuranceGroupNumber?: string;
            emergencyContactName?: string;
            emergencyContactPhone?: string;
            emergencyContactRelation?: string;
            consentGiven?: boolean;
            additionalNotes?: string;
        }
    ) {
        return this.portalService.submitPreVisitForm(req.user.userId, appointmentId, data);
    }

    // ==========================================
    // Insurance Documents
    // ==========================================

    @Get('insurance-documents')
    async getInsuranceDocuments(@Request() req) {
        return this.portalService.getInsuranceDocuments(req.user.userId);
    }

    @Post('insurance-documents')
    @UseInterceptors(FileInterceptor('file'))
    async uploadInsuranceDocument(
        @Request() req,
        @UploadedFile() file: Express.Multer.File,
        @Body() data: {
            documentType: string;
            title: string;
            insuranceProvider?: string;
            policyNumber?: string;
            groupNumber?: string;
            expirationDate?: string;
        }
    ) {
        return this.portalService.uploadInsuranceDocument(req.user.userId, file, {
            ...data,
            expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
        });
    }

    @Delete('insurance-documents/:id')
    async deleteInsuranceDocument(@Request() req, @Param('id') id: string) {
        return this.portalService.deleteInsuranceDocument(req.user.userId, id);
    }

    // ==========================================
    // Profile
    // ==========================================

    @Get('profile')
    async getProfile(@Request() req) {
        return this.portalService.getProfile(req.user.userId);
    }

    @Patch('profile')
    async updateProfile(
        @Request() req,
        @Body() data: {
            phone?: string;
            emergencyContactName?: string;
            emergencyContactPhone?: string;
        }
    ) {
        return this.portalService.updateProfile(req.user.userId, data);
    }
}
