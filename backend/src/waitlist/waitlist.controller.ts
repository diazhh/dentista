import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { ContactWaitlistDto } from './dto/contact-waitlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WaitlistStatus } from '@prisma/client';

@ApiTags('waitlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @ApiOperation({ summary: 'Add patient to waitlist' })
  create(@Body() createDto: CreateWaitlistDto, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.create(createDto, dentistId, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all waitlist entries' })
  @ApiQuery({ name: 'status', enum: WaitlistStatus, required: false })
  findAll(@Request() req, @Query('status') status?: WaitlistStatus) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.findAll(dentistId, tenantId, status);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Find available slots for a specific date' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format', example: '2025-01-15' })
  findAvailableSlots(@Request() req, @Query('date') date: string) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.findAvailableSlots(dentistId, tenantId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get waitlist entry by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.findOne(id, dentistId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update waitlist entry' })
  update(@Param('id') id: string, @Body() updateDto: UpdateWaitlistDto, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.update(id, updateDto, dentistId, tenantId);
  }

  @Patch(':id/contact')
  @ApiOperation({ summary: 'Mark patient as contacted' })
  contact(@Param('id') id: string, @Body() contactDto: ContactWaitlistDto, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.contact(id, contactDto, dentistId, tenantId);
  }

  @Patch(':id/schedule/:appointmentId')
  @ApiOperation({ summary: 'Mark waitlist entry as scheduled with appointment ID' })
  schedule(@Param('id') id: string, @Param('appointmentId') appointmentId: string, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.schedule(id, appointmentId, dentistId, tenantId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel waitlist entry' })
  cancel(@Param('id') id: string, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.cancel(id, dentistId, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove waitlist entry' })
  remove(@Param('id') id: string, @Request() req) {
    const dentistId = req.user.userId;
    const tenantId = req.user.tenantId || dentistId;
    return this.waitlistService.remove(id, dentistId, tenantId);
  }

  @Post('expire-old')
  @ApiOperation({ summary: 'Expire old waitlist entries (admin/cron)' })
  expireOld() {
    return this.waitlistService.expireOldEntries();
  }
}
