import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { Public } from '../auth/public.decorator'; // Assuming we'll create this or use existing mechanism

@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Public()
    @Get('clinics')
    findAllClinics(@Query('city') city?: string, @Query('specialty') specialty?: string) {
        return this.publicService.findAllClinics({ city, specialty });
    }

    @Public()
    @Get('clinics/:slug')
    findClinic(@Param('slug') slug: string) {
        return this.publicService.findClinicBySlug(slug);
    }

    @Public()
    @Get('dentists')
    findAllDentists() {
        return this.publicService.findDentists();
    }
}
