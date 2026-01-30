import { Controller, Get, Query, UseGuards, Req, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExcelExporter } from './exporters/excel.exporter';
import { PdfExporter } from './exporters/pdf.exporter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly excelExporter: ExcelExporter,
    private readonly pdfExporter: PdfExporter,
  ) {}

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

  // ==========================================
  // Export Endpoints
  // ==========================================

  @Get('financial/export/excel')
  @ApiOperation({ summary: 'Export financial report to Excel' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'dentistId', required: false })
  async exportFinancialExcel(
    @Req() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    const data = await this.reportsService.getFinancialSummary({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });

    const buffer = await this.excelExporter.exportFinancialReport(data);
    const filename = `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('financial/export/pdf')
  @ApiOperation({ summary: 'Export financial report to PDF' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'dentistId', required: false })
  async exportFinancialPdf(
    @Req() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    const data = await this.reportsService.getFinancialSummary({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });

    const buffer = await this.pdfExporter.exportFinancialReport(data);
    const filename = `financial-report-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('appointments/export/excel')
  @ApiOperation({ summary: 'Export appointment statistics to Excel' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'dentistId', required: false })
  async exportAppointmentsExcel(
    @Req() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    const data = await this.reportsService.getAppointmentStats({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });

    const buffer = await this.excelExporter.exportAppointmentStats(data);
    const filename = `appointments-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('appointments/export/pdf')
  @ApiOperation({ summary: 'Export appointment statistics to PDF' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'dentistId', required: false })
  async exportAppointmentsPdf(
    @Req() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    const data = await this.reportsService.getAppointmentStats({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });

    const buffer = await this.pdfExporter.exportAppointmentStats(data);
    const filename = `appointments-report-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('patients/export/excel')
  @ApiOperation({ summary: 'Export patient statistics to Excel' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportPatientsExcel(
    @Req() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    const data = await this.reportsService.getPatientStats({
      tenantId: req.user.tenantId,
      ...dateRange,
    });

    const buffer = await this.excelExporter.exportPatientStats(data);
    const filename = `patients-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('patients/export/pdf')
  @ApiOperation({ summary: 'Export patient statistics to PDF' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportPatientsPdf(
    @Req() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    const data = await this.reportsService.getPatientStats({
      tenantId: req.user.tenantId,
      ...dateRange,
    });

    const buffer = await this.pdfExporter.exportPatientStats(data);
    const filename = `patients-report-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('treatment-plans/export/excel')
  @ApiOperation({ summary: 'Export treatment plan statistics to Excel' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'dentistId', required: false })
  async exportTreatmentPlansExcel(
    @Req() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    const data = await this.reportsService.getTreatmentPlanStats({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });

    const buffer = await this.excelExporter.exportTreatmentPlanStats(data);
    const filename = `treatment-plans-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('treatment-plans/export/pdf')
  @ApiOperation({ summary: 'Export treatment plan statistics to PDF' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'dentistId', required: false })
  async exportTreatmentPlansPdf(
    @Req() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    const dateRange = this.getDateRange(startDate, endDate);
    const data = await this.reportsService.getTreatmentPlanStats({
      tenantId: req.user.tenantId,
      ...dateRange,
      dentistId,
    });

    const buffer = await this.pdfExporter.exportTreatmentPlansPdf(data);
    const filename = `treatment-plans-report-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
