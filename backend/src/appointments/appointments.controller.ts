import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentSoapDto, CreateAppointmentProcedureDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.create(createAppointmentDto, providerId, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments for the provider' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Items per page (default: no pagination)' })
  findAll(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    const p = page ? parseInt(page, 10) : undefined;
    const ps = pageSize ? parseInt(pageSize, 10) : undefined;
    return this.appointmentsService.findAll(providerId, tenantId, startDate, endDate, p, ps);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s appointments' })
  findToday(@Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.findToday(providerId, tenantId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments (next 7 days)' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead (default: 7)' })
  findUpcoming(@Request() req, @Query('days') days?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    const daysAhead = days ? parseInt(days, 10) : 7;
    return this.appointmentsService.findUpcoming(providerId, tenantId, daysAhead);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment' })
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.update(id, updateAppointmentDto, providerId, tenantId);
  }

  @Patch(':id/soap')
  @ApiOperation({ summary: 'Update appointment SOAP clinical note' })
  updateSoap(@Param('id') id: string, @Body() soapDto: UpdateAppointmentSoapDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.updateSoap(id, soapDto, providerId, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.updateStatus(id, status, providerId, tenantId);
  }

  // === Procedures CRUD ===

  @Get(':id/procedures')
  @ApiOperation({ summary: 'Get procedures for an appointment' })
  getProcedures(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.getProcedures(id, providerId, tenantId);
  }

  @Post(':id/procedures')
  @ApiOperation({ summary: 'Add a procedure to an appointment' })
  addProcedure(
    @Param('id') id: string,
    @Body() dto: CreateAppointmentProcedureDto,
    @Request() req,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.addProcedure(id, dto, providerId, tenantId);
  }

  @Patch(':id/procedures/:procedureId')
  @ApiOperation({ summary: 'Update a procedure' })
  updateProcedure(
    @Param('id') id: string,
    @Param('procedureId') procedureId: string,
    @Body() dto: Partial<CreateAppointmentProcedureDto>,
    @Request() req,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.updateProcedure(id, procedureId, dto, providerId, tenantId);
  }

  @Delete(':id/procedures/:procedureId')
  @ApiOperation({ summary: 'Remove a procedure' })
  removeProcedure(
    @Param('id') id: string,
    @Param('procedureId') procedureId: string,
    @Request() req,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.removeProcedure(id, procedureId, providerId, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.remove(id, providerId, tenantId);
  }
}
