import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PublicService } from './public.service';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiQuery, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Public')
@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    /**
     * Lists all available medical specialties (enum values with labels).
     * Useful for populating filter dropdowns in the frontend.
     */
    @Public()
    @Get('specialties')
    getSpecialties() {
        return this.publicService.getAvailableSpecialties();
    }

    @Public()
    @Get('clinics')
    @ApiQuery({ name: 'city', required: false })
    @ApiQuery({ name: 'specialty', required: false, description: 'Filter by MedicalSpecialty enum value (e.g. GENERAL_MEDICINE)' })
    findAllClinics(@Query('city') city?: string, @Query('specialty') specialty?: string) {
        return this.publicService.findAllClinics({ city, specialty });
    }

    @Public()
    @Get('clinics/:slug')
    findClinic(@Param('slug') slug: string) {
        return this.publicService.findClinicBySlug(slug);
    }

    @Public()
    @Get('providers')
    @ApiQuery({ name: 'specialty', required: false, description: 'Filter providers by MedicalSpecialty enum value' })
    findAllProviders(@Query('specialty') specialty?: string) {
        return this.publicService.findProviders({ specialty });
    }

    /**
     * Allows a CLINIC_ADMIN user to claim an unclaimed clinic.
     * Requires authentication - not a public endpoint.
     */
    @Post('clinics/:id/claim')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Claim an unclaimed clinic as CLINIC_ADMIN',
        description: 'Sets the authenticated CLINIC_ADMIN user as the administrator of an unclaimed clinic.',
    })
    claimClinic(@Param('id') clinicId: string, @Request() req) {
        return this.publicService.claimClinic(clinicId, req.user.userId);
    }
}
