import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/prescriptions.dto';

@ApiTags('general-medicine / prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/general-medicine/prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prescription' })
  create(@Body() dto: CreatePrescriptionDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.prescriptionsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prescriptions' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.prescriptionsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.prescriptionsService.findOne(id, providerId, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prescription' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.prescriptionsService.delete(id, providerId, tenantId);
  }
}
