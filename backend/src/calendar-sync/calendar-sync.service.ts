import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string; displayName?: string }[];
  reminders?: { useDefault: boolean; overrides?: { method: string; minutes: number }[] };
}

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);
  private oauth2Client: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_CALENDAR_REDIRECT_URI'),
    );
  }

  /**
   * Generate OAuth URL for Google Calendar authorization
   */
  getAuthUrl(userId: string, tenantId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    const state = Buffer.from(JSON.stringify({ userId, tenantId })).toString('base64');

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Handle OAuth callback and save tokens
   */
  async handleCallback(code: string, state: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);

    const { userId, tenantId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Get calendar info
    this.oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find((c) => c.primary);

    // Upsert calendar connection
    await this.prisma.calendarConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'GOOGLE',
        },
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        calendarId: primaryCalendar?.id || 'primary',
        calendarName: primaryCalendar?.summary,
        lastSyncError: null,
      },
      create: {
        userId,
        tenantId,
        provider: 'GOOGLE',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        calendarId: primaryCalendar?.id || 'primary',
        calendarName: primaryCalendar?.summary,
      },
    });

    this.logger.log(`Google Calendar connected for user ${userId}`);
  }

  /**
   * Get a valid OAuth2 client for a user
   */
  private async getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: {
        userId,
        provider: 'GOOGLE',
      },
    });

    if (!connection) {
      throw new BadRequestException('Google Calendar not connected');
    }

    const client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_CALENDAR_REDIRECT_URI'),
    );

    client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.tokenExpiry?.getTime(),
    });

    // Check if token needs refresh
    if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
      try {
        const { credentials } = await client.refreshAccessToken();
        await this.prisma.calendarConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: credentials.access_token!,
            refreshToken: credentials.refresh_token || connection.refreshToken,
            tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          },
        });
        client.setCredentials(credentials);
      } catch (error) {
        this.logger.error(`Failed to refresh token for user ${userId}`, error);
        throw new UnauthorizedException('Failed to refresh calendar token. Please reconnect.');
      }
    }

    return client;
  }

  /**
   * Get connection status for a user
   */
  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    provider?: string;
    calendarName?: string;
    lastSyncAt?: Date;
    syncEnabled?: boolean;
  }> {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { userId },
    });

    if (!connection) {
      return { connected: false };
    }

    return {
      connected: true,
      provider: connection.provider,
      calendarName: connection.calendarName || undefined,
      lastSyncAt: connection.lastSyncAt || undefined,
      syncEnabled: connection.syncEnabled,
    };
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(userId: string, event: CalendarEvent): Promise<string> {
    const client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    const connection = await this.prisma.calendarConnection.findFirst({
      where: { userId, provider: 'GOOGLE' },
    });

    const response = await calendar.events.insert({
      calendarId: connection?.calendarId || 'primary',
      requestBody: event,
    });

    this.logger.log(`Created calendar event ${response.data.id} for user ${userId}`);
    return response.data.id!;
  }

  /**
   * Update an event in Google Calendar
   */
  async updateEvent(userId: string, eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    const client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    const connection = await this.prisma.calendarConnection.findFirst({
      where: { userId, provider: 'GOOGLE' },
    });

    await calendar.events.update({
      calendarId: connection?.calendarId || 'primary',
      eventId,
      requestBody: event,
    });

    this.logger.log(`Updated calendar event ${eventId} for user ${userId}`);
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    const connection = await this.prisma.calendarConnection.findFirst({
      where: { userId, provider: 'GOOGLE' },
    });

    await calendar.events.delete({
      calendarId: connection?.calendarId || 'primary',
      eventId,
    });

    this.logger.log(`Deleted calendar event ${eventId} for user ${userId}`);
  }

  /**
   * Sync an appointment to Google Calendar
   */
  async syncAppointmentToCalendar(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    const connection = await this.prisma.calendarConnection.findFirst({
      where: {
        userId: appointment.dentistId,
        provider: 'GOOGLE',
        syncEnabled: true,
      },
    });

    if (!connection) {
      this.logger.debug(`No calendar connection for dentist ${appointment.dentistId}`);
      return;
    }

    const event: CalendarEvent = {
      summary: `Cita: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
      description: `Procedimiento: ${appointment.procedureType}\n${appointment.notes || ''}`,
      start: {
        dateTime: appointment.appointmentDate.toISOString(),
        timeZone: 'America/Santo_Domingo',
      },
      end: {
        dateTime: new Date(
          appointment.appointmentDate.getTime() + appointment.duration * 60000,
        ).toISOString(),
        timeZone: 'America/Santo_Domingo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
    };

    try {
      const externalEventId = await this.createEvent(appointment.dentistId, event);

      // Log the sync
      await this.prisma.calendarSyncLog.create({
        data: {
          connectionId: connection.id,
          action: 'create',
          direction: 'to_external',
          appointmentId: appointment.id,
          externalEventId,
          status: 'success',
        },
      });

      // Update last sync time
      await this.prisma.calendarConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Failed to sync appointment ${appointmentId} to calendar`, error);

      await this.prisma.calendarSyncLog.create({
        data: {
          connectionId: connection.id,
          action: 'create',
          direction: 'to_external',
          appointmentId: appointment.id,
          status: 'failed',
          error: error.message,
        },
      });

      await this.prisma.calendarConnection.update({
        where: { id: connection.id },
        data: { lastSyncError: error.message },
      });
    }
  }

  /**
   * Disconnect calendar integration
   */
  async disconnect(userId: string): Promise<void> {
    await this.prisma.calendarConnection.deleteMany({
      where: { userId },
    });

    this.logger.log(`Disconnected calendar for user ${userId}`);
  }

  /**
   * Update sync settings
   */
  async updateSyncSettings(
    userId: string,
    settings: { syncEnabled?: boolean; syncDirection?: string },
  ): Promise<void> {
    await this.prisma.calendarConnection.updateMany({
      where: { userId },
      data: settings,
    });
  }
}
