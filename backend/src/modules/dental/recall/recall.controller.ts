import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RecallService } from './recall.service';
import { CreateDentalRecallDto, UpdateDentalRecallDto } from './dto/recall.dto';

@ApiTags('dental / recall')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/dental/recall')
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dental recall' })
  create(@Body() dto: CreateDentalRecallDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.recallService.create(providerId, tenantId, dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all recalls for a patient' })
  findAllByPatient(@Param('patientId') patientId: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.recallService.findAllByPatient(patientId, tenantId);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get all overdue recalls for the tenant' })
  findOverdue(@Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.recallService.findOverdue(tenantId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming recalls within N days' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead (default 30)' })
  findUpcoming(@Request() req, @Query('days') days?: string) {
    const tenantId = req.user.tenantId || req.user.userId;
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.recallService.findUpcoming(tenantId, daysNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a dental recall by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.recallService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dental recall' })
  update(@Param('id') id: string, @Body() dto: UpdateDentalRecallDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.recallService.update(id, tenantId, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark recall as completed and auto-calculate next due date' })
  markCompleted(
    @Param('id') id: string,
    @Body('appointmentId') appointmentId: string,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.recallService.markCompleted(id, tenantId, appointmentId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dental recall' })
  remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.recallService.delete(id, tenantId);
  }
}
