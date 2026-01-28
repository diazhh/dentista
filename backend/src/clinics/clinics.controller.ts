import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { CreateOperatoryDto } from './dto/create-operatory.dto';
import { UpdateOperatoryDto } from './dto/update-operatory.dto';
import { AssignOperatoryDto } from './dto/assign-operatory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('clinics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  // Clinics endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new clinic (Super Admin only)' })
  createClinic(@Body() createClinicDto: CreateClinicDto, @Request() req) {
    return this.clinicsService.createClinic(createClinicDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clinics' })
  findAllClinics() {
    return this.clinicsService.findAllClinics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get clinic by ID' })
  findOneClinic(@Param('id') id: string) {
    return this.clinicsService.findOneClinic(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update clinic (Super Admin only)' })
  updateClinic(@Param('id') id: string, @Body() updateClinicDto: UpdateClinicDto) {
    return this.clinicsService.updateClinic(id, updateClinicDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete clinic (Super Admin only)' })
  removeClinic(@Param('id') id: string) {
    return this.clinicsService.removeClinic(id);
  }

  // Operatories endpoints
  @Post('operatories')
  @ApiOperation({ summary: 'Create a new operatory (Super Admin only)' })
  createOperatory(@Body() createOperatoryDto: CreateOperatoryDto) {
    return this.clinicsService.createOperatory(createOperatoryDto);
  }

  @Get('operatories/all')
  @ApiOperation({ summary: 'Get all operatories' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  findAllOperatories(@Query('clinicId') clinicId?: string) {
    return this.clinicsService.findAllOperatories(clinicId);
  }

  @Get('operatories/:id')
  @ApiOperation({ summary: 'Get operatory by ID' })
  findOneOperatory(@Param('id') id: string) {
    return this.clinicsService.findOneOperatory(id);
  }

  @Patch('operatories/:id')
  @ApiOperation({ summary: 'Update operatory (Super Admin only)' })
  updateOperatory(@Param('id') id: string, @Body() updateOperatoryDto: UpdateOperatoryDto) {
    return this.clinicsService.updateOperatory(id, updateOperatoryDto);
  }

  @Delete('operatories/:id')
  @ApiOperation({ summary: 'Delete operatory (Super Admin only)' })
  removeOperatory(@Param('id') id: string) {
    return this.clinicsService.removeOperatory(id);
  }

  // Operatory Assignments endpoints
  @Post('operatories/assignments')
  @ApiOperation({ summary: 'Assign operatory to dentist (Super Admin only)' })
  assignOperatory(@Body() assignOperatoryDto: AssignOperatoryDto) {
    return this.clinicsService.assignOperatory(assignOperatoryDto);
  }

  @Get('operatories/assignments/all')
  @ApiOperation({ summary: 'Get operatory assignments' })
  @ApiQuery({ name: 'operatoryId', required: false, description: 'Filter by operatory ID' })
  @ApiQuery({ name: 'dentistId', required: false, description: 'Filter by dentist ID' })
  findOperatoryAssignments(
    @Query('operatoryId') operatoryId?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    return this.clinicsService.findOperatoryAssignments(operatoryId, dentistId);
  }

  @Delete('operatories/assignments/:id')
  @ApiOperation({ summary: 'Remove operatory assignment (Super Admin only)' })
  removeOperatoryAssignment(@Param('id') id: string) {
    return this.clinicsService.removeOperatoryAssignment(id);
  }
}
