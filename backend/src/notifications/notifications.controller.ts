import { Controller, Get, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationPreferenceDto } from './dto/create-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  getPreferences(@Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId;
    return this.notificationsService.getPreferences(userId, tenantId);
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Create notification preferences' })
  createPreferences(@Body() dto: CreateNotificationPreferenceDto, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId;
    return this.notificationsService.createPreferences(dto, userId, tenantId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updatePreferences(@Body() dto: UpdateNotificationPreferenceDto, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId;
    return this.notificationsService.updatePreferences(dto, userId, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  getNotifications(@Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId;
    return this.notificationsService.getNotifications(userId, tenantId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a notification (admin/system)' })
  sendNotification(@Body() dto: SendNotificationDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.notificationsService.sendNotification(dto, tenantId);
  }
}
