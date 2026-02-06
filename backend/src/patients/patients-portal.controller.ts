import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { PatientsPortalService } from './patients-portal.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { ClaimProfileDto } from './dto/claim-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';

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
}
