import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { MembershipStatus } from '@prisma/client';

@Injectable()
export class TenantMembershipService {
  constructor(private prisma: PrismaService) {}

  // Invite staff member (creates user if doesn't exist)
  async inviteStaff(inviteStaffDto: InviteStaffDto, tenantId: string) {
    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email: inviteStaffDto.email },
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: inviteStaffDto.email,
          name: inviteStaffDto.name,
          role: inviteStaffDto.role,
        },
      });
    }

    // Check if membership already exists
    const existingMembership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenantId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('Staff member already exists in this workspace');
    }

    // Create membership
    return this.prisma.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId: tenantId,
        role: inviteStaffDto.role,
        permissions: inviteStaffDto.permissions,
        status: MembershipStatus.PENDING_INVITATION,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });
  }

  // Add existing user as staff member
  async createMembership(createMembershipDto: CreateMembershipDto, tenantId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createMembershipDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if membership already exists
    const existingMembership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: createMembershipDto.userId,
          tenantId: tenantId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('Membership already exists');
    }

    return this.prisma.tenantMembership.create({
      data: {
        userId: createMembershipDto.userId,
        tenantId: tenantId,
        role: createMembershipDto.role,
        permissions: createMembershipDto.permissions,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  // Get all staff members for a tenant
  async findAllStaff(tenantId: string) {
    return this.prisma.tenantMembership.findMany({
      where: {
        tenantId: tenantId,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get all workspaces for a staff member
  async findMyWorkspaces(userId: string) {
    return this.prisma.tenantMembership.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get membership by ID
  async findOne(id: string, tenantId: string) {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
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
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  // Update membership (permissions, role, status)
  async update(id: string, updateMembershipDto: UpdateMembershipDto, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.tenantMembership.update({
      where: { id },
      data: updateMembershipDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  // Accept invitation (staff member accepts)
  async acceptInvitation(id: string, userId: string) {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        id: id,
        userId: userId,
        status: MembershipStatus.PENDING_INVITATION,
      },
    });

    if (!membership) {
      throw new NotFoundException('Invitation not found or already accepted');
    }

    return this.prisma.tenantMembership.update({
      where: { id },
      data: {
        status: MembershipStatus.ACTIVE,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });
  }

  // Reject invitation (staff member rejects)
  async rejectInvitation(id: string, userId: string) {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        id: id,
        userId: userId,
        status: MembershipStatus.PENDING_INVITATION,
      },
    });

    if (!membership) {
      throw new NotFoundException('Invitation not found');
    }

    return this.prisma.tenantMembership.update({
      where: { id },
      data: {
        isActive: false,
        status: MembershipStatus.INACTIVE,
      },
    });
  }

  // Remove staff member (soft delete)
  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.tenantMembership.update({
      where: { id },
      data: {
        isActive: false,
        status: MembershipStatus.INACTIVE,
      },
    });
  }
}
