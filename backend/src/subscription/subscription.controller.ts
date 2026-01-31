import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription details' })
  @ApiResponse({ status: 200, description: 'Current subscription information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentSubscription(@Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.subscriptionService.getCurrentSubscription(tenantId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of available plans' })
  async getPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Get('check-limit/patients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if patient limit allows adding new patients' })
  @ApiResponse({ status: 200, description: 'Patient limit check result' })
  async checkPatientLimit(@Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.subscriptionService.checkPatientLimit(tenantId);
  }

  @Get('check-feature/:feature')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if a specific feature is available' })
  @ApiParam({ name: 'feature', description: 'Feature name to check (e.g., whatsappEnabled, reports, apiAccess)' })
  @ApiResponse({ status: 200, description: 'Feature access check result' })
  async checkFeature(@Request() req, @Param('feature') feature: string) {
    const tenantId = req.user.tenantId || req.user.userId;
    const hasAccess = await this.subscriptionService.checkFeatureAccess(tenantId, feature as any);
    return { feature, hasAccess };
  }
}
