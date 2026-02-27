import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ImagingService } from './imaging.service';
import { CreateDentalImageDto, UpdateDentalImageDto } from './dto/imaging.dto';

@ApiTags('dental / imaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/dental/imaging')
export class ImagingController {
  constructor(private readonly imagingService: ImagingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dental image record' })
  create(@Body() dto: CreateDentalImageDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.imagingService.create(providerId, tenantId, dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all dental images for a patient' })
  @ApiQuery({ name: 'imageType', required: false, description: 'Filter by image type (e.g. PERIAPICAL, BITEWING, PANORAMIC)' })
  findAllByPatient(
    @Param('patientId') patientId: string,
    @Request() req,
    @Query('imageType') imageType?: string,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.imagingService.findAllByPatient(patientId, tenantId, imageType);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get dental images for a specific appointment' })
  findByAppointment(@Param('appointmentId') appointmentId: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.imagingService.findByAppointment(appointmentId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dental image by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.imagingService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dental image record' })
  update(@Param('id') id: string, @Body() dto: UpdateDentalImageDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.imagingService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dental image record' })
  remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.imagingService.delete(id, tenantId);
  }
}
