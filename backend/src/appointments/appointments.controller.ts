import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
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
  findAll(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.findAll(providerId, tenantId, startDate, endDate);
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

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.updateStatus(id, status, providerId, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.appointmentsService.remove(id, providerId, tenantId);
  }
}
