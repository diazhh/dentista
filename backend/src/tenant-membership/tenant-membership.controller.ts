import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantMembershipService } from './tenant-membership.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tenant-membership')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenant-membership')
export class TenantMembershipController {
  constructor(private readonly tenantMembershipService: TenantMembershipService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Invite staff member to workspace (creates user if needed)' })
  inviteStaff(@Body() inviteStaffDto: InviteStaffDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.tenantMembershipService.inviteStaff(inviteStaffDto, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Add existing user as staff member' })
  create(@Body() createMembershipDto: CreateMembershipDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.tenantMembershipService.createMembership(createMembershipDto, tenantId);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Get all staff members for my workspace' })
  findAllStaff(@Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.tenantMembershipService.findAllStaff(tenantId);
  }

  @Get('my-workspaces')
  @ApiOperation({ summary: 'Get all workspaces I am a member of (for staff)' })
  findMyWorkspaces(@Request() req) {
    const userId = req.user.userId;
    return this.tenantMembershipService.findMyWorkspaces(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get membership by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.tenantMembershipService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update membership (permissions, role, status)' })
  update(@Param('id') id: string, @Body() updateMembershipDto: UpdateMembershipDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.tenantMembershipService.update(id, updateMembershipDto, tenantId);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept invitation (staff member)' })
  acceptInvitation(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.tenantMembershipService.acceptInvitation(id, userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject invitation (staff member)' })
  rejectInvitation(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.tenantMembershipService.rejectInvitation(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove staff member from workspace' })
  remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.tenantMembershipService.remove(id, tenantId);
  }
}
