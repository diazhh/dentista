import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsuranceService } from './insurance.service';
import {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
  CreatePatientInsuranceDto,
  UpdatePatientInsuranceDto,
  VerifyInsuranceDto,
} from './dto/insurance.dto';

@Controller('insurance')
@UseGuards(JwtAuthGuard)
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // --- Insurance Providers ---

  @Get('providers')
  getProviders(@Request() req, @Query('includeInactive') includeInactive?: string) {
    return this.insuranceService.getProviders(
      req.user.tenantId,
      includeInactive === 'true',
    );
  }

  @Get('providers/:id')
  getProvider(@Param('id') id: string, @Request() req) {
    return this.insuranceService.getProvider(id, req.user.tenantId);
  }

  @Post('providers')
  createProvider(@Body() dto: CreateInsuranceProviderDto, @Request() req) {
    return this.insuranceService.createProvider(req.user.tenantId, dto);
  }

  @Patch('providers/:id')
  updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceProviderDto,
    @Request() req,
  ) {
    return this.insuranceService.updateProvider(id, req.user.tenantId, dto);
  }

  @Delete('providers/:id')
  deleteProvider(@Param('id') id: string, @Request() req) {
    return this.insuranceService.deleteProvider(id, req.user.tenantId);
  }

  // --- Patient Insurances ---

  @Get('patients/:patientId')
  getPatientInsurances(@Param('patientId') patientId: string, @Request() req) {
    return this.insuranceService.getPatientInsurances(patientId, req.user.tenantId);
  }

  @Get(':id')
  getPatientInsurance(@Param('id') id: string, @Request() req) {
    return this.insuranceService.getPatientInsurance(id, req.user.tenantId);
  }

  @Post()
  createPatientInsurance(@Body() dto: CreatePatientInsuranceDto, @Request() req) {
    return this.insuranceService.createPatientInsurance(req.user.tenantId, dto);
  }

  @Patch(':id')
  updatePatientInsurance(
    @Param('id') id: string,
    @Body() dto: UpdatePatientInsuranceDto,
    @Request() req,
  ) {
    return this.insuranceService.updatePatientInsurance(id, req.user.tenantId, dto);
  }

  @Delete(':id')
  deletePatientInsurance(@Param('id') id: string, @Request() req) {
    return this.insuranceService.deletePatientInsurance(id, req.user.tenantId);
  }

  // --- Verification ---

  @Post(':id/verify')
  verifyInsurance(
    @Param('id') id: string,
    @Body() dto: VerifyInsuranceDto,
    @Request() req,
  ) {
    return this.insuranceService.verifyInsurance(
      id,
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  // --- Coverage Check ---

  @Get('patients/:patientId/coverage')
  checkCoverage(@Param('patientId') patientId: string, @Request() req) {
    return this.insuranceService.checkCoverage(patientId, req.user.tenantId);
  }
}
