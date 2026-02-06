import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { StaffManagementService } from './staff-management.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffPermissionsDto } from './dto/update-staff-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

// Roles allowed to manage staff
const MANAGER_ROLES: UserRole[] = [
  UserRole.PROVIDER,
  UserRole.CLINIC_ADMIN,
  UserRole.STAFF_MANAGER,
];

@ApiTags('staff-management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffManagementController {
  constructor(private readonly staffManagementService: StaffManagementService) {}

  @Get()
  @ApiOperation({ summary: 'List all staff members in current tenant' })
  async getStaffList(@Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    this.assertManagerRole(req.user.role);
    return this.staffManagementService.getStaffList(tenantId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new staff member to the workspace' })
  async inviteStaff(@Body() dto: InviteStaffDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    this.assertManagerRole(req.user.role);
    return this.staffManagementService.inviteStaff(
      tenantId,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Put(':membershipId/role')
  @ApiOperation({ summary: 'Update a staff member role' })
  async updateStaffRole(
    @Param('membershipId') membershipId: string,
    @Body() body: { role: UserRole },
    @Request() req,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    this.assertManagerRole(req.user.role);
    return this.staffManagementService.updateStaffRole(
      tenantId,
      membershipId,
      body.role,
      req.user.userId,
      req.user.role,
    );
  }

  @Put(':membershipId/permissions')
  @ApiOperation({ summary: 'Update granular permissions for a staff member' })
  async updateStaffPermissions(
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateStaffPermissionsDto,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    this.assertManagerRole(req.user.role);
    return this.staffManagementService.updateStaffPermissions(
      tenantId,
      membershipId,
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':membershipId')
  @ApiOperation({ summary: 'Remove a staff member from the workspace' })
  async removeStaff(
    @Param('membershipId') membershipId: string,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    this.assertManagerRole(req.user.role);
    return this.staffManagementService.removeStaff(
      tenantId,
      membershipId,
      req.user.userId,
      req.user.role,
    );
  }

  @Get('my-tenants')
  @ApiOperation({ summary: 'Get all tenants the current staff user belongs to (for tenant switcher)' })
  async getMyTenants(@Request() req) {
    return this.staffManagementService.getStaffTenants(req.user.userId);
  }

  /**
   * Assert that the requesting user has a manager-level role
   */
  private assertManagerRole(role: UserRole): void {
    if (!MANAGER_ROLES.includes(role)) {
      throw new ForbiddenException(
        'Only PROVIDER, CLINIC_ADMIN, or STAFF_MANAGER can manage staff',
      );
    }
  }
}
