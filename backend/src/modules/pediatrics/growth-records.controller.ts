import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GrowthRecordsService } from './growth-records.service';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './dto/growth-records.dto';

@ApiTags('pediatrics / growth-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/pediatrics/growth-records')
export class GrowthRecordsController {
  constructor(private readonly growthRecordsService: GrowthRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new growth record' })
  create(@Body() dto: CreateGrowthRecordDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.growthRecordsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all growth records' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.growthRecordsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get growth record by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.growthRecordsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a growth record' })
  update(@Param('id') id: string, @Body() dto: UpdateGrowthRecordDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.growthRecordsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a growth record' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.growthRecordsService.delete(id, providerId, tenantId);
  }
}
