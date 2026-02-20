import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BodyMeasurementsService } from './body-measurements.service';
import { CreateBodyMeasurementDto, UpdateBodyMeasurementDto } from './dto/body-measurements.dto';

@ApiTags('nutrition / body-measurements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/nutrition/body-measurements')
export class BodyMeasurementsController {
  constructor(private readonly bodyMeasurementsService: BodyMeasurementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new body measurement' })
  create(@Body() dto: CreateBodyMeasurementDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.bodyMeasurementsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all body measurements' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.bodyMeasurementsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get body measurement by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.bodyMeasurementsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a body measurement' })
  update(@Param('id') id: string, @Body() dto: UpdateBodyMeasurementDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.bodyMeasurementsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a body measurement' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.bodyMeasurementsService.delete(id, providerId, tenantId);
  }
}
