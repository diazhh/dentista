import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LensPrescriptionsService } from './lens-prescriptions.service';
import { CreateLensPrescriptionDto, UpdateLensPrescriptionDto } from './dto/lens-prescriptions.dto';

@ApiTags('ophthalmology / lens-prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/ophthalmology/lens-prescriptions')
export class LensPrescriptionsController {
  constructor(private readonly lensPrescriptionsService: LensPrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lens prescription' })
  create(@Body() dto: CreateLensPrescriptionDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.lensPrescriptionsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lens prescriptions' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.lensPrescriptionsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lens prescription by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.lensPrescriptionsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lens prescription' })
  update(@Param('id') id: string, @Body() dto: UpdateLensPrescriptionDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.lensPrescriptionsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lens prescription' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.lensPrescriptionsService.delete(id, providerId, tenantId);
  }
}
