import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private getDateRange(startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = startDate
      ? new Date(startDate)
      : new Date(end.getFullYear(), end.getMonth(), 1); // Default to start of current month
    start.setHours(0, 0, 0, 0);

    return { startDate: start, endDate: end };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary data' })
  @ApiResponse({ status: 200, description: 'Dashboard summary' })
  async getDashboard(@Req() req) {
    return this.reportsService.getDashboardSummary(req.user.tenantId);
  }

  @Get('financial')
  @ApiOperation({ summary: 'Get financial summary report' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dentistId', required: false, description: 'Filter by dentist' })
  @ApiResponse({ status: 200, description: 'Financial summary report' })
  async getFinancialReport(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    return this.reportsService.getFinancialSummary({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get appointment statistics report' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dentistId', required: false, description: 'Filter by dentist' })
  @ApiResponse({ status: 200, description: 'Appointment statistics report' })
  async getAppointmentReport(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    return this.reportsService.getAppointmentStats({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });
  }

  @Get('patients')
  @ApiOperation({ summary: 'Get patient statistics report' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Patient statistics report' })
  async getPatientReport(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    return this.reportsService.getPatientStats({
      tenantId: req.user.tenantId,
      ...dateRange,
    });
  }

  @Get('treatment-plans')
  @ApiOperation({ summary: 'Get treatment plan statistics report' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dentistId', required: false, description: 'Filter by dentist' })
  @ApiResponse({ status: 200, description: 'Treatment plan statistics report' })
  async getTreatmentPlanReport(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    return this.reportsService.getTreatmentPlanStats({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });
  }
}
