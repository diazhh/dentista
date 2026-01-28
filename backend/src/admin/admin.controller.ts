import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private auditLogService: AuditLogService,
  ) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants (Super Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of all tenants' })
  async getAllTenants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllTenants(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant details by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantById(@Param('id') id: string) {
    return this.adminService.getTenantById(id);
  }

  @Put('tenants/:id/subscription')
  @ApiOperation({ summary: 'Update tenant subscription (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async updateTenantSubscription(
    @Request() req,
    @Param('id') id: string,
    @Body() data: {
      subscriptionTier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
      subscriptionStatus?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
      maxPatients?: number;
      storageGB?: number;
    },
  ) {
    return this.adminService.updateTenantSubscription(id, req.user.userId, data);
  }

  @Post('tenants/:id/suspend')
  @ApiOperation({ summary: 'Suspend a tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant suspended successfully' })
  async suspendTenant(@Request() req, @Param('id') id: string) {
    return this.adminService.suspendTenant(id, req.user.userId);
  }

  @Post('tenants/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant reactivated successfully' })
  async reactivateTenant(@Request() req, @Param('id') id: string) {
    return this.adminService.reactivateTenant(id, req.user.userId);
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Create a new tenant (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  async createTenant(
    @Request() req,
    @Body() data: {
      name: string;
      subdomain: string;
      subscriptionTier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
      maxPatients?: number;
      storageGB?: number;
      ownerId: string;
    },
  ) {
    return this.adminService.createTenant(req.user.userId, data);
  }

  @Put('tenants/:id')
  @ApiOperation({ summary: 'Update tenant details (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  async updateTenant(
    @Request() req,
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      subdomain?: string;
    },
  ) {
    return this.adminService.updateTenant(id, req.user.userId, data);
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Delete a tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  async deleteTenant(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteTenant(id, req.user.userId);
  }

  @Get('metrics/system')
  @ApiOperation({ summary: 'Get system-wide metrics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Get('metrics/revenue')
  @ApiOperation({ summary: 'Get revenue metrics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Revenue metrics including MRR and ARR' })
  async getRevenueMetrics() {
    return this.adminService.getRevenueMetrics();
  }

  @Get('metrics/activity')
  @ApiOperation({ summary: 'Get tenant activity metrics (Super Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to look back' })
  @ApiResponse({ status: 200, description: 'Tenant activity metrics' })
  async getTenantActivity(@Query('days') days?: string) {
    return this.adminService.getTenantActivity(days ? parseInt(days) : 30);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs (Super Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
  ) {
    return this.auditLogService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      userId,
      tenantId,
      action: action as any,
      entity,
    });
  }

  @Get('audit-logs/statistics')
  @ApiOperation({ summary: 'Get audit log statistics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit log statistics' })
  async getAuditLogStatistics() {
    return this.auditLogService.getStatistics({});
  }

  @Get('audit-logs/:id')
  @ApiOperation({ summary: 'Get audit log by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit log details' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLogById(@Param('id') id: string) {
    return this.auditLogService.findOne(id);
  }

  // Tenant Users Management
  @Get('tenants/:id/users')
  @ApiOperation({ summary: 'Get users of a specific tenant (Super Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of tenant users' })
  async getTenantUsers(
    @Param('id') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTenantUsers(tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('tenants/:id/users')
  @ApiOperation({ summary: 'Add user to tenant (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'User added to tenant' })
  async addUserToTenant(
    @Param('id') tenantId: string,
    @Body() data: {
      userId?: string;
      email?: string;
      name?: string;
      password?: string;
      role: string;
    },
    @Request() req,
  ) {
    return this.adminService.addUserToTenant(tenantId, data, req.user.userId);
  }

  @Delete('tenants/:tenantId/users/:userId')
  @ApiOperation({ summary: 'Remove user from tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User removed from tenant' })
  async removeUserFromTenant(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.adminService.removeUserFromTenant(tenantId, userId, req.user.userId);
  }

  @Put('tenants/:tenantId/users/:userId/role')
  @ApiOperation({ summary: 'Update user role in tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  async updateTenantUserRole(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() data: { role: string },
    @Request() req,
  ) {
    return this.adminService.updateTenantUserRole(tenantId, userId, data.role, req.user.userId);
  }
}
