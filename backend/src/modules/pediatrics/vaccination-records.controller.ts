import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VaccinationRecordsService } from './vaccination-records.service';
import { CreateVaccinationRecordDto, UpdateVaccinationRecordDto } from './dto/vaccination-records.dto';

@ApiTags('pediatrics / vaccination-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/pediatrics/vaccination-records')
export class VaccinationRecordsController {
  constructor(private readonly vaccinationRecordsService: VaccinationRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vaccination record' })
  create(@Body() dto: CreateVaccinationRecordDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.vaccinationRecordsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vaccination records' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.vaccinationRecordsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vaccination record by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.vaccinationRecordsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vaccination record' })
  update(@Param('id') id: string, @Body() dto: UpdateVaccinationRecordDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.vaccinationRecordsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vaccination record' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.vaccinationRecordsService.delete(id, providerId, tenantId);
  }
}
