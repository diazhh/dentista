import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CalendarSyncService } from './calendar-sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@ApiTags('calendar-sync')
@Controller('calendar-sync')
export class CalendarSyncController {
  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get calendar connection status' })
  @ApiResponse({ status: 200, description: 'Connection status retrieved' })
  async getStatus(@Req() req) {
    return this.calendarSyncService.getConnectionStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('google/auth-url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google Calendar authorization URL' })
  @ApiResponse({ status: 200, description: 'Auth URL generated' })
  async getGoogleAuthUrl(@Req() req) {
    const authUrl = this.calendarSyncService.getAuthUrl(req.user.id, req.user.tenantId);
    return { url: authUrl };
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google Calendar OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.calendarSyncService.handleCallback(code, state);
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
      return res.redirect(`${frontendUrl}/settings/calendar?connected=true`);
    } catch (error) {
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
      return res.redirect(`${frontendUrl}/settings/calendar?error=${encodeURIComponent(error.message)}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect calendar integration' })
  @ApiResponse({ status: 200, description: 'Calendar disconnected' })
  async disconnect(@Req() req) {
    await this.calendarSyncService.disconnect(req.user.id);
    return { message: 'Calendar disconnected successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update sync settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Req() req,
    @Body() body: { syncEnabled?: boolean; syncDirection?: string },
  ) {
    await this.calendarSyncService.updateSyncSettings(req.user.id, body);
    return { message: 'Settings updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync-appointment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually sync an appointment to calendar' })
  @ApiResponse({ status: 200, description: 'Appointment synced' })
  async syncAppointment(@Body('appointmentId') appointmentId: string) {
    await this.calendarSyncService.syncAppointmentToCalendar(appointmentId);
    return { message: 'Appointment synced successfully' };
  }
}
