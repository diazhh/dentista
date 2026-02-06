import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { CreateConsultationRoomDto } from './dto/create-consultation-room.dto';
import { UpdateConsultationRoomDto } from './dto/update-consultation-room.dto';
import { AssignRoomDto } from './dto/assign-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('clinics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  // Clinics endpoints
  @Get('stats')
  @ApiOperation({ summary: 'Get clinic statistics' })
  getStats() {
    return this.clinicsService.getStats();
  }

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

  // Consultation Rooms endpoints
  @Post('rooms')
  @ApiOperation({ summary: 'Create a new consultation room (Super Admin only)' })
  createConsultationRoom(@Body() createConsultationRoomDto: CreateConsultationRoomDto) {
    return this.clinicsService.createConsultationRoom(createConsultationRoomDto);
  }

  @Get('rooms/all')
  @ApiOperation({ summary: 'Get all consultation rooms' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  findAllConsultationRooms(@Query('clinicId') clinicId?: string) {
    return this.clinicsService.findAllConsultationRooms(clinicId);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get consultation room by ID' })
  findOneConsultationRoom(@Param('id') id: string) {
    return this.clinicsService.findOneConsultationRoom(id);
  }

  @Patch('rooms/:id')
  @ApiOperation({ summary: 'Update consultation room (Super Admin only)' })
  updateConsultationRoom(@Param('id') id: string, @Body() updateConsultationRoomDto: UpdateConsultationRoomDto) {
    return this.clinicsService.updateConsultationRoom(id, updateConsultationRoomDto);
  }

  @Delete('rooms/:id')
  @ApiOperation({ summary: 'Delete consultation room (Super Admin only)' })
  removeConsultationRoom(@Param('id') id: string) {
    return this.clinicsService.removeConsultationRoom(id);
  }

  // Room Assignments endpoints
  @Post('rooms/assignments')
  @ApiOperation({ summary: 'Assign consultation room to provider (Super Admin only)' })
  assignRoom(@Body() assignRoomDto: AssignRoomDto) {
    return this.clinicsService.assignRoom(assignRoomDto);
  }

  @Get('rooms/assignments/all')
  @ApiOperation({ summary: 'Get room assignments' })
  @ApiQuery({ name: 'roomId', required: false, description: 'Filter by room ID' })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filter by provider ID' })
  findRoomAssignments(
    @Query('roomId') roomId?: string,
    @Query('providerId') providerId?: string,
  ) {
    return this.clinicsService.findRoomAssignments(roomId, providerId);
  }

  @Delete('rooms/assignments/:id')
  @ApiOperation({ summary: 'Remove room assignment (Super Admin only)' })
  removeRoomAssignment(@Param('id') id: string) {
    return this.clinicsService.removeRoomAssignment(id);
  }
}
