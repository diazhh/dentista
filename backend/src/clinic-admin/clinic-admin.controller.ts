import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClinicAdminService } from './clinic-admin.service';
import { UpdateClinicAdminDto } from './dto/update-clinic.dto';
import { CreateClinicStaffDto } from './dto/create-clinic-staff.dto';
import { UpdateClinicStaffDto } from './dto/update-clinic-staff.dto';

@ApiTags('clinic-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clinic-admin')
export class ClinicAdminController {
  constructor(private readonly clinicAdminService: ClinicAdminService) {}

  // ==========================================
  // Dashboard
  // ==========================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get clinic admin dashboard with occupancy, revenue, and stats' })
  async getDashboard(@Request() req) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.getDashboard(clinicId);
  }

  // ==========================================
  // Clinic Management
  // ==========================================

  @Get('clinic')
  @ApiOperation({ summary: 'Get clinic details for the admin' })
  async getClinic(@Request() req) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.getClinic(clinicId);
  }

  @Put('clinic')
  @ApiOperation({ summary: 'Update clinic information' })
  async updateClinic(@Request() req, @Body() dto: UpdateClinicAdminDto) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.updateClinic(clinicId, dto);
  }

  // ==========================================
  // Consultation Rooms
  // ==========================================

  @Get('rooms')
  @ApiOperation({ summary: 'List all consultation rooms with assignments' })
  async getRooms(@Request() req) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.getRooms(clinicId);
  }

  @Get('rooms/:id/schedule')
  @ApiOperation({ summary: 'Get calendar/schedule view for a room on a given date' })
  @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' })
  async getRoomSchedule(
    @Request() req,
    @Param('id') roomId: string,
    @Query('date') date: string,
  ) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.getRoomSchedule(clinicId, roomId, date);
  }

  // ==========================================
  // Reports
  // ==========================================

  @Get('occupancy')
  @ApiOperation({ summary: 'Get occupancy statistics for a date range' })
  @ApiQuery({ name: 'start', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end', required: true, description: 'End date (YYYY-MM-DD)' })
  async getOccupancyReport(
    @Request() req,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.getOccupancyReport(clinicId, start, end);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report from rentals for a date range' })
  @ApiQuery({ name: 'start', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end', required: true, description: 'End date (YYYY-MM-DD)' })
  async getRevenueReport(
    @Request() req,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.getRevenueReport(clinicId, start, end);
  }

  // ==========================================
  // Staff Management
  // ==========================================

  @Get('staff')
  @ApiOperation({ summary: 'List all clinic staff members' })
  async getStaff(@Request() req) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.getStaff(clinicId);
  }

  @Post('staff')
  @ApiOperation({ summary: 'Add a new staff member to the clinic' })
  async addStaff(@Request() req, @Body() dto: CreateClinicStaffDto) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.addStaff(clinicId, dto);
  }

  @Put('staff/:id')
  @ApiOperation({ summary: 'Update a staff member' })
  async updateStaff(
    @Request() req,
    @Param('id') staffId: string,
    @Body() dto: UpdateClinicStaffDto,
  ) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.updateStaff(clinicId, staffId, dto);
  }

  @Delete('staff/:id')
  @ApiOperation({ summary: 'Deactivate a staff member' })
  async removeStaff(@Request() req, @Param('id') staffId: string) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.removeStaff(clinicId, staffId);
  }

  // ==========================================
  // Rental Requests
  // ==========================================

  @Get('rental-requests')
  @ApiOperation({ summary: 'Get pending rental requests for the clinic' })
  async getRentalRequests(@Request() req) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.getRentalRequests(clinicId);
  }

  @Post('rental-requests/:id/approve')
  @ApiOperation({ summary: 'Approve a rental request' })
  async approveRental(@Request() req, @Param('id') requestId: string) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.approveRental(clinicId, requestId);
  }

  @Post('rental-requests/:id/reject')
  @ApiOperation({ summary: 'Reject a rental request' })
  async rejectRental(@Request() req, @Param('id') requestId: string) {
    const clinicId = await this.clinicAdminService.resolveClinicId(req.user.userId);
    return this.clinicAdminService.rejectRental(clinicId, requestId);
  }
}
