import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { PatientsPortalService } from './patients-portal.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { ClaimProfileDto } from './dto/claim-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateHealthProfileDto } from './dto/update-health-profile.dto';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { ModifyConsentDto } from './dto/modify-consent.dto';
import { ShareExamDto } from './dto/share-exam.dto';

@ApiTags('Patient Portal')
@Controller('portal')
@UseGuards(JwtAuthGuard)
export class PatientsPortalController {
    constructor(private readonly portalService: PatientsPortalService) { }

    @Get('dashboard')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get patient dashboard data' })
    async getDashboard(@Request() req) {
        return this.portalService.getDashboard(req.user.userId);
    }

    @Get('appointments')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get patient appointments' })
    async getAppointments(@Request() req) {
        return this.portalService.getAppointments(req.user.userId);
    }

    @Get('documents')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get patient documents' })
    async getDocuments(@Request() req) {
        return this.portalService.getDocuments(req.user.userId);
    }

    // ==========================================
    // Phase 1.2 - Independent Patient Entity
    // ==========================================

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Independent patient self-registration' })
    async registerPatient(@Body() dto: RegisterPatientDto) {
        return this.portalService.registerIndependent(dto);
    }

    @Post('claim-profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Claim an existing patient profile' })
    async claimProfile(@Request() req, @Body() dto: ClaimProfileDto) {
        return this.portalService.claimProfile(req.user.userId, dto);
    }

    @Get('my-providers')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all providers for this patient' })
    async getMyProviders(@Request() req) {
        return this.portalService.getMyProviders(req.user.userId);
    }

    @Get('my-consents')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all consent records' })
    async getMyConsents(@Request() req) {
        return this.portalService.getMyConsents(req.user.userId);
    }

    @Patch('privacy')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update default data access level' })
    async updatePrivacy(@Request() req, @Body() dto: UpdatePrivacyDto) {
        return this.portalService.updateDefaultAccess(req.user.userId, dto.defaultDataAccess);
    }

    @Post('consents/:id/revoke')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Revoke a specific consent' })
    async revokeConsent(@Request() req, @Param('id') consentId: string) {
        return this.portalService.revokeConsent(req.user.userId, consentId);
    }

    // ==========================================
    // Phase 4 - Portal del Paciente Avanzado
    // ==========================================

    @Get('enhanced-dashboard')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get enhanced patient dashboard with counts and recent exams' })
    async getEnhancedDashboard(@Request() req) {
        return this.portalService.getEnhancedDashboard(req.user.userId);
    }

    @Get('health-profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get patient health profile data' })
    async getHealthProfile(@Request() req) {
        return this.portalService.getHealthProfile(req.user.userId);
    }

    @Put('health-profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update patient health profile' })
    async updateHealthProfile(@Request() req, @Body() dto: UpdateHealthProfileDto) {
        return this.portalService.updateHealthProfile(req.user.userId, dto);
    }

    @Get('notifications')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get patient notifications (consent requests, appointment reminders)' })
    async getNotifications(@Request() req) {
        return this.portalService.getNotifications(req.user.userId);
    }

    @Post('consents/:id/grant')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Grant a pending consent request' })
    async grantConsent(@Request() req, @Param('id') consentId: string, @Body() dto: GrantConsentDto) {
        return this.portalService.grantConsent(req.user.userId, consentId, dto);
    }

    @Post('consents/:id/deny')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Deny a pending consent request' })
    async denyConsent(@Request() req, @Param('id') consentId: string) {
        return this.portalService.denyConsent(req.user.userId, consentId);
    }

    @Put('consents/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Modify an existing granted consent' })
    async modifyConsent(@Request() req, @Param('id') consentId: string, @Body() dto: ModifyConsentDto) {
        return this.portalService.modifyConsent(req.user.userId, consentId, dto);
    }

    @Post('exams/:examId/share')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Share a medical exam with a provider' })
    async shareExam(@Request() req, @Param('examId') examId: string, @Body() dto: ShareExamDto) {
        return this.portalService.shareExam(req.user.userId, examId, dto);
    }

    @Delete('exam-shares/:shareId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Revoke a shared exam' })
    async unshareExam(@Request() req, @Param('shareId') shareId: string) {
        return this.portalService.unshareExam(req.user.userId, shareId);
    }

    @Get('exam-shares')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all active exam shares with providers' })
    async getExamShares(@Request() req) {
        return this.portalService.getExamShares(req.user.userId);
    }
}
