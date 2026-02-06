import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RecurringAppointmentsService } from './recurring-appointments.service';
import { CreateRecurringAppointmentDto } from './dto/create-recurring-appointment.dto';
import { UpdateRecurringAppointmentDto } from './dto/update-recurring-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('recurring-appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recurring-appointments')
export class RecurringAppointmentsController {
  constructor(private readonly recurringAppointmentsService: RecurringAppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recurring appointment pattern' })
  create(@Body() createDto: CreateRecurringAppointmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.recurringAppointmentsService.create(createDto, providerId, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recurring appointments' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.recurringAppointmentsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring appointment by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.recurringAppointmentsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recurring appointment pattern' })
  update(@Param('id') id: string, @Body() updateDto: UpdateRecurringAppointmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.recurringAppointmentsService.update(id, updateDto, providerId, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel recurring appointment (cancels all future appointments)' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.recurringAppointmentsService.remove(id, providerId, tenantId);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Manually generate appointments for the next 3 months' })
  generateAppointments(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.recurringAppointmentsService.generateAppointments(id, providerId, tenantId);
  }
}
