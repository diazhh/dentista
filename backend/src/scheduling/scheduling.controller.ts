import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { ValidateSlotDto } from './dto/validate-slot.dto';
import { CreateRoomRentalDto } from './dto/create-room-rental.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available appointment slots for a provider on a date' })
  @ApiQuery({ name: 'providerId', required: true, description: 'Provider ID' })
  @ApiQuery({ name: 'date', required: true, description: 'Date to check (ISO 8601)' })
  @ApiQuery({ name: 'serviceId', required: false, description: 'Service ID (for capability/duration filtering)' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Clinic ID (optional filter)' })
  getAvailableSlots(
    @Query('providerId') providerId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.schedulingService.getAvailableSlots(providerId, date, serviceId, clinicId);
  }

  @Post('validate-slot')
  @ApiOperation({ summary: 'Validate that an appointment slot is available (no double-booking)' })
  validateSlot(@Body() dto: ValidateSlotDto) {
    return this.schedulingService.validateAppointmentSlot(
      dto.providerId,
      dto.roomId,
      new Date(dto.startTime),
      new Date(dto.endTime),
    );
  }

  @Get('room-calendar/:roomId')
  @ApiOperation({ summary: 'Get all appointments for a room in a date range' })
  @ApiQuery({ name: 'start', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'end', required: true, description: 'End date (ISO 8601)' })
  getRoomCalendar(
    @Param('roomId') roomId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.schedulingService.getRoomCalendar(roomId, start, end);
  }

  @Get('clinic-calendar/:clinicId')
  @ApiOperation({ summary: 'Get all rooms with their appointments for a clinic on a date' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (ISO 8601)' })
  getClinicCalendar(
    @Param('clinicId') clinicId: string,
    @Query('date') date: string,
  ) {
    return this.schedulingService.getClinicCalendar(clinicId, date);
  }

  @Post('rental-request')
  @ApiOperation({ summary: 'Request a room rental (creates a RoomAssignment with type RENTAL)' })
  requestRental(@Body() dto: CreateRoomRentalDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.schedulingService.requestRental(providerId, tenantId, dto);
  }
}
