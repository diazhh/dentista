import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffPermissionsDto } from './dto/update-staff-permissions.dto';
import { MembershipStatus, UserRole } from '@prisma/client';

// Staff roles that can be managed
const MANAGEABLE_STAFF_ROLES: UserRole[] = [
  UserRole.STAFF_MANAGER,
  UserRole.STAFF_RECEPTIONIST,
  UserRole.STAFF_BILLING,
  UserRole.STAFF_ASSISTANT,
];

// Roles that can manage staff
const MANAGER_ROLES: UserRole[] = [
  UserRole.PROVIDER,
  UserRole.CLINIC_ADMIN,
  UserRole.STAFF_MANAGER,
];

@Injectable()
export class StaffManagementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate that the requesting user has permission to manage staff
   */
  private async validateManagerPermission(
    tenantId: string,
    managerId: string,
    managerRole: UserRole,
  ): Promise<void> {
    if (!MANAGER_ROLES.includes(managerRole)) {
      throw new ForbiddenException('You do not have permission to manage staff');
    }

    // STAFF_MANAGER can only manage staff below their level
    if (managerRole === UserRole.STAFF_MANAGER) {
      const membership = await this.prisma.tenantMembership.findFirst({
        where: {
          userId: managerId,
          tenantId,
          isActive: true,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (!membership) {
        throw new ForbiddenException('You are not an active member of this workspace');
      }
    }
  }

  /**
   * Validate that a STAFF_MANAGER is not trying to manage someone at or above their level
   */
  private validateStaffHierarchy(
    managerRole: UserRole,
    targetRole: UserRole,
  ): void {
    if (managerRole === UserRole.STAFF_MANAGER) {
      // STAFF_MANAGER cannot manage PROVIDER, CLINIC_ADMIN, or other STAFF_MANAGERs
      if (
        targetRole === UserRole.PROVIDER ||
        targetRole === UserRole.CLINIC_ADMIN ||
        targetRole === UserRole.STAFF_MANAGER
      ) {
        throw new ForbiddenException(
          'Staff Managers can only manage staff below their level',
        );
      }
    }
  }

  /**
   * List all staff members (TenantMemberships) for a tenant
   */
  async getStaffList(tenantId: string) {
    return this.prisma.tenantMembership.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatarUrl: true,
            specialties: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Invite a new staff member
   * - Looks up or creates user by email
   * - Creates TenantMembership with PENDING_INVITATION status
   */
  async inviteStaff(
    tenantId: string,
    ownerId: string,
    ownerRole: UserRole,
    dto: InviteStaffDto,
  ) {
    await this.validateManagerPermission(tenantId, ownerId, ownerRole);

    // Validate the role being assigned is a staff role
    if (!MANAGEABLE_STAFF_ROLES.includes(dto.role)) {
      throw new BadRequestException(
        `Invalid role. Must be one of: ${MANAGEABLE_STAFF_ROLES.join(', ')}`,
      );
    }

    this.validateStaffHierarchy(ownerRole, dto.role);

    // Look up or create user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          role: dto.role,
        },
      });
    }

    // Check for existing membership
    const existingMembership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        throw new ConflictException('This user is already a member of this workspace');
      }

      // Reactivate if previously removed
      return this.prisma.tenantMembership.update({
        where: { id: existingMembership.id },
        data: {
          role: dto.role,
          permissions: dto.permissions ? JSON.parse(JSON.stringify(dto.permissions)) : undefined,
          status: MembershipStatus.PENDING_INVITATION,
          isActive: true,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true },
          },
          tenant: {
            select: { id: true, name: true, subdomain: true },
          },
        },
      });
    }

    // Create new membership
    return this.prisma.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId,
        role: dto.role,
        permissions: dto.permissions ? JSON.parse(JSON.stringify(dto.permissions)) : undefined,
        status: MembershipStatus.PENDING_INVITATION,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        tenant: {
          select: { id: true, name: true, subdomain: true },
        },
      },
    });
  }

  /**
   * Update a staff member's role
   */
  async updateStaffRole(
    tenantId: string,
    membershipId: string,
    newRole: UserRole,
    managerId: string,
    managerRole: UserRole,
  ) {
    await this.validateManagerPermission(tenantId, managerId, managerRole);

    if (!MANAGEABLE_STAFF_ROLES.includes(newRole)) {
      throw new BadRequestException(
        `Invalid role. Must be one of: ${MANAGEABLE_STAFF_ROLES.join(', ')}`,
      );
    }

    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id: membershipId, tenantId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException('Staff membership not found');
    }

    this.validateStaffHierarchy(managerRole, membership.role);
    this.validateStaffHierarchy(managerRole, newRole);

    return this.prisma.tenantMembership.update({
      where: { id: membershipId },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });
  }

  /**
   * Update granular permissions for a staff member
   */
  async updateStaffPermissions(
    tenantId: string,
    membershipId: string,
    permissions: UpdateStaffPermissionsDto,
    managerId: string,
    managerRole: UserRole,
  ) {
    await this.validateManagerPermission(tenantId, managerId, managerRole);

    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id: membershipId, tenantId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException('Staff membership not found');
    }

    this.validateStaffHierarchy(managerRole, membership.role);

    return this.prisma.tenantMembership.update({
      where: { id: membershipId },
      data: { permissions: permissions as any },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });
  }

  /**
   * Remove a staff member (soft delete - set isActive = false)
   */
  async removeStaff(
    tenantId: string,
    membershipId: string,
    managerId: string,
    managerRole: UserRole,
  ) {
    await this.validateManagerPermission(tenantId, managerId, managerRole);

    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id: membershipId, tenantId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException('Staff membership not found');
    }

    // Cannot remove yourself
    if (membership.userId === managerId) {
      throw new ForbiddenException('You cannot remove yourself from the workspace');
    }

    this.validateStaffHierarchy(managerRole, membership.role);

    return this.prisma.tenantMembership.update({
      where: { id: membershipId },
      data: {
        isActive: false,
        status: MembershipStatus.INACTIVE,
      },
    });
  }

  /**
   * For a staff user, get all tenants they have active memberships in
   * Used for the tenant switcher in the frontend
   */
  async getStaffTenants(userId: string) {
    const memberships = await this.prisma.tenantMembership.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            practiceType: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return memberships.map((m) => ({
      id: m.id,
      tenantId: m.tenant.id,
      tenantName: m.tenant.name,
      subdomain: m.tenant.subdomain,
      practiceType: m.tenant.practiceType,
      role: m.role,
      status: m.status,
      permissions: m.permissions,
    }));
  }

  /**
   * Get a single membership with permissions (used by CASL factory)
   */
  async getMembershipWithPermissions(userId: string, tenantId: string) {
    return this.prisma.tenantMembership.findFirst({
      where: {
        userId,
        tenantId,
        isActive: true,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        id: true,
        role: true,
        permissions: true,
      },
    });
  }
}
