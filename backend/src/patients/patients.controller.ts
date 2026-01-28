import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PatientsService } from './patients.service';
import { PatientsDashboardService } from './patients-dashboard.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { TransferPatientDto } from './dto/transfer-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { parse } from 'csv-parse/sync';

@ApiTags('patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly dashboardService: PatientsDashboardService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient successfully created' })
  create(@Request() req, @Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(req.user.id, createPatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients for current dentist' })
  @ApiResponse({ status: 200, description: 'List of patients' })
  findAll(@Request() req) {
    return this.patientsService.findAllForDentist(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({ status: 200, description: 'Patient details' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.patientsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient' })
  @ApiResponse({ status: 200, description: 'Patient successfully updated' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  update(@Request() req, @Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, req.user.id, updatePatientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate patient relationship' })
  @ApiResponse({ status: 200, description: 'Patient relationship deactivated' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.patientsService.remove(id, req.user.id);
  }

  @Get('search/query')
  @ApiOperation({ summary: 'Search patients by document ID, name, or phone' })
  @ApiResponse({ status: 200, description: 'List of matching patients' })
  @ApiQuery({ name: 'documentId', required: false, type: String })
  @ApiQuery({ name: 'firstName', required: false, type: String })
  @ApiQuery({ name: 'lastName', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  search(@Request() req, @Query() searchDto: SearchPatientDto) {
    return this.patientsService.search(req.user.id, searchDto);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer patient to another dentist' })
  @ApiResponse({ status: 200, description: 'Patient successfully transferred' })
  @ApiResponse({ status: 404, description: 'Patient or new dentist not found' })
  @ApiResponse({ status: 400, description: 'Patient already assigned to this dentist' })
  transfer(@Request() req, @Param('id') id: string, @Body() transferDto: TransferPatientDto) {
    return this.patientsService.transfer(id, req.user.id, transferDto);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export all patients to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file with patients data' })
  async exportCSV(@Request() req, @Res() res: Response) {
    const csv = await this.patientsService.exportToCSV(req.user.id);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=patients.csv');
    res.send(csv);
  }

  @Post('import/csv')
  @ApiOperation({ summary: 'Import patients from CSV file' })
  @ApiResponse({ status: 200, description: 'Import results with success count and errors' })
  @ApiResponse({ status: 400, description: 'Invalid CSV file' })
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const csvData = parse(file.buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
      });

      return this.patientsService.importFromCSV(req.user.id, csvData);
    } catch (error) {
      throw new BadRequestException('Invalid CSV format');
    }
  }

  @Get(':id/dashboard/summary')
  @ApiOperation({ summary: 'Get patient dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary with metrics, timeline, and alerts' })
  @ApiResponse({ status: 403, description: 'No access to this patient' })
  getDashboardSummary(@Request() req, @Param('id') patientId: string) {
    return this.dashboardService.getDashboardSummary(patientId, req.user.id);
  }

  @Get(':id/appointments/:appointmentId/details')
  @ApiOperation({ summary: 'Get detailed appointment information' })
  @ApiResponse({ status: 200, description: 'Complete appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'No access to this patient' })
  getAppointmentDetail(
    @Request() req,
    @Param('id') patientId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.dashboardService.getAppointmentDetail(patientId, appointmentId, req.user.id);
  }
}
