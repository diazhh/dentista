import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getAllTenants(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          memberships: {
            select: {
              id: true,
              role: true,
              status: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              memberships: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.tenant.count(),
    ]);

    return {
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTenantById(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            licenseNumber: true,
            npiNumber: true,
            specialization: true,
          },
        },
        memberships: {
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
        },
        _count: {
          select: {
            appointments: true,
            memberships: true,
            patientDentistRelations: true,
          },
        },
      },
    });
  }

  async updateTenantSubscription(
    tenantId: string,
    userId: string,
    data: {
      subscriptionTier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
      subscriptionStatus?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
      maxPatients?: number;
      storageGB?: number;
    },
  ) {
    const before = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        maxPatients: true,
        storageGB: true,
      },
    });

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.subscriptionTier && { subscriptionTier: data.subscriptionTier }),
        ...(data.subscriptionStatus && { subscriptionStatus: data.subscriptionStatus }),
        ...(data.maxPatients !== undefined && { maxPatients: data.maxPatients }),
        ...(data.storageGB !== undefined && { storageGB: data.storageGB }),
      },
    });

    await this.auditLogService.create({
      userId,
      tenantId,
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: tenantId,
      changes: { before, after: data },
    });

    return updated;
  }

  async getSystemMetrics() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalAppointments,
      appointmentsThisMonth,
      tenantsByTier,
      tenantsByStatus,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({
        where: { subscriptionStatus: 'ACTIVE' },
      }),
      this.prisma.user.count(),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.tenant.groupBy({
        by: ['subscriptionTier'],
        _count: true,
      }),
      this.prisma.tenant.groupBy({
        by: ['subscriptionStatus'],
        _count: true,
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalAppointments,
      appointmentsThisMonth,
      tenantsByTier,
      tenantsByStatus,
    };
  }

  async getRevenueMetrics() {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
      },
      select: {
        subscriptionTier: true,
        createdAt: true,
      },
    });

    const tierPricing = {
      STARTER: 29,
      PROFESSIONAL: 79,
      ENTERPRISE: 199,
    };

    const mrr = tenants.reduce((sum, tenant) => {
      return sum + (tierPricing[tenant.subscriptionTier] || 0);
    }, 0);

    const arr = mrr * 12;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const newTenantsThisMonth = tenants.filter(t => {
      const createdDate = new Date(t.createdAt);
      return createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear;
    }).length;

    const revenueByTier = Object.keys(tierPricing).map(tier => ({
      tier,
      count: tenants.filter(t => t.subscriptionTier === tier).length,
      revenue: tenants.filter(t => t.subscriptionTier === tier).length * tierPricing[tier],
    }));

    return {
      mrr,
      arr,
      newTenantsThisMonth,
      revenueByTier,
    };
  }

  async getTenantActivity(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appointments = await this.prisma.appointment.groupBy({
      by: ['tenantId'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: true,
      orderBy: {
        _count: {
          tenantId: 'desc',
        },
      },
      take: 10,
    });

    const tenantIds = appointments.map(a => a.tenantId);
    const tenantDetails = await this.prisma.tenant.findMany({
      where: {
        id: {
          in: tenantIds,
        },
      },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
      },
    });

    return appointments.map(a => {
      const tenant = tenantDetails.find(t => t.id === a.tenantId);
      return {
        tenantId: a.tenantId,
        tenantName: tenant?.name,
        subscriptionTier: tenant?.subscriptionTier,
        appointmentCount: a._count,
      };
    });
  }

  async suspendTenant(tenantId: string, userId: string) {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: 'CANCELLED',
      },
    });

    await this.auditLogService.create({
      userId,
      tenantId,
      action: 'SUSPEND',
      entity: 'Tenant',
      entityId: tenantId,
    });

    return updated;
  }

  async reactivateTenant(tenantId: string, userId: string) {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: 'ACTIVE',
      },
    });

    await this.auditLogService.create({
      userId,
      tenantId,
      action: 'REACTIVATE',
      entity: 'Tenant',
      entityId: tenantId,
    });

    return updated;
  }

  async createTenant(
    userId: string,
    data: {
      name: string;
      subdomain: string;
      subscriptionTier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
      maxPatients?: number;
      storageGB?: number;
      ownerId: string;
    },
  ) {
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain: data.subdomain,
        subscriptionTier: data.subscriptionTier || 'STARTER',
        subscriptionStatus: 'TRIAL',
        maxPatients: data.maxPatients || 50,
        storageGB: data.storageGB || 5,
        ownerId: data.ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await this.auditLogService.create({
      userId,
      action: 'CREATE',
      entity: 'Tenant',
      entityId: tenant.id,
      metadata: { tenantData: data },
    });

    return tenant;
  }

  async updateTenant(
    tenantId: string,
    userId: string,
    data: {
      name?: string;
      subdomain?: string;
    },
  ) {
    const before = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        subdomain: true,
      },
    });

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.subdomain && { subdomain: data.subdomain }),
      },
    });

    await this.auditLogService.create({
      userId,
      tenantId,
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: tenantId,
      changes: { before, after: data },
    });

    return updated;
  }

  async deleteTenant(tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        subdomain: true,
      },
    });

    await this.prisma.tenant.delete({
      where: { id: tenantId },
    });

    await this.auditLogService.create({
      userId,
      action: 'DELETE',
      entity: 'Tenant',
      entityId: tenantId,
      metadata: { deletedTenant: tenant },
    });

    return { message: 'Tenant deleted successfully', tenant };
  }

  // Tenant Users Management
  async getTenantUsers(tenantId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          tenantMemberships: {
            some: {
              tenantId,
            },
          },
        },
        include: {
          tenantMemberships: {
            where: { tenantId },
            select: {
              role: true,
              createdAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          tenantMemberships: {
            some: {
              tenantId,
            },
          },
        },
      }),
    ]);

    return {
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.tenantMemberships[0]?.role,
        joinedAt: user.tenantMemberships[0]?.createdAt,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addUserToTenant(
    tenantId: string,
    data: {
      userId?: string;
      email?: string;
      name?: string;
      password?: string;
      role: string;
    },
    adminUserId: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    let user;

    if (data.userId) {
      // Add existing user to tenant
      user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already in tenant
      const existingMembership = await this.prisma.tenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId: data.userId,
            tenantId,
          },
        },
      });

      if (existingMembership) {
        throw new Error('User is already a member of this tenant');
      }
    } else if (data.email) {
      // Create new user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(data.password || 'TempPassword123!', 10);

      user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name || data.email.split('@')[0],
          passwordHash: hashedPassword,
          role: 'DENTIST', // Default role for new users
        },
      });
    } else {
      throw new Error('Either userId or email must be provided');
    }

    // Create membership
    const membership = await this.prisma.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId,
        role: data.role as any,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'CREATE',
      entity: 'TenantMembership',
      entityId: membership.id,
      metadata: {
        tenantId,
        userId: user.id,
        role: data.role,
      },
    });

    return {
      message: 'User added to tenant successfully',
      membership,
    };
  }

  async removeUserFromTenant(tenantId: string, userId: string, adminUserId: string) {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      include: {
        user: true,
        tenant: true,
      },
    });

    if (!membership) {
      throw new Error('User is not a member of this tenant');
    }

    // Check if user is the owner
    if (membership.tenant.ownerId === userId) {
      throw new Error('Cannot remove the owner from the tenant');
    }

    await this.prisma.tenantMembership.delete({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'DELETE',
      entity: 'TenantMembership',
      entityId: membership.id,
      metadata: {
        tenantId,
        userId,
        removedUser: membership.user.email,
      },
    });

    return {
      message: 'User removed from tenant successfully',
    };
  }

  async updateTenantUserRole(
    tenantId: string,
    userId: string,
    role: string,
    adminUserId: string,
  ) {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!membership) {
      throw new Error('User is not a member of this tenant');
    }

    const oldRole = membership.role;

    const updatedMembership = await this.prisma.tenantMembership.update({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      data: { role: role as any },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'UPDATE',
      entity: 'TenantMembership',
      entityId: membership.id,
      metadata: {
        tenantId,
        userId,
        oldRole,
        newRole: role,
      },
    });

    return {
      message: 'User role updated successfully',
      membership: updatedMembership,
    };
  }

  /**
   * Impersonate a user as Super Admin
   * Generates tokens that allow acting as the target user
   */
  async impersonateUser(
    adminId: string,
    targetUserId: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    // Verify admin is SUPER_ADMIN
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'SUPER_ADMIN') {
      throw new NotFoundException('Unauthorized: Super Admin access required');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        ownedTenants: true,
        tenantMemberships: {
          where: { isActive: true, status: 'ACTIVE' },
          include: { tenant: true },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Determine tenant context
    let tenantId = null;
    if (targetUser.ownedTenants?.length > 0) {
      tenantId = targetUser.ownedTenants[0].id;
    } else if (targetUser.tenantMemberships?.length > 0) {
      tenantId = targetUser.tenantMemberships[0].tenantId;
    }

    // Generate impersonation token with special flag
    const payload = {
      email: targetUser.email,
      sub: targetUser.id,
      role: targetUser.role,
      tenantId,
      impersonatedBy: adminId, // Mark this as an impersonation session
      impersonatedByEmail: admin.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h', // Shorter expiry for impersonation
    });

    // Generate refresh token
    const refreshToken = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.session.create({
      data: {
        userId: targetUser.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    // Log the impersonation action
    await this.auditLogService.create({
      userId: adminId,
      action: 'IMPERSONATE',
      entity: 'User',
      entityId: targetUserId,
      metadata: {
        adminId,
        adminEmail: admin.email,
        targetUserId,
        targetUserEmail: targetUser.email,
        ipAddress,
        userAgent,
      },
    });

    this.logger.warn(
      `Super Admin ${admin.email} (${adminId}) started impersonating user ${targetUser.email} (${targetUserId})`,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      },
      impersonation: {
        isImpersonating: true,
        originalAdminId: adminId,
        originalAdminEmail: admin.email,
      },
    };
  }

  /**
   * Stop impersonation session and return admin's original tokens
   */
  async stopImpersonation(currentUserId: string) {
    // This would typically need the original admin's ID from the token
    // For now, we just invalidate the current session
    await this.prisma.session.updateMany({
      where: { userId: currentUserId },
      data: { isRevoked: true },
    });

    this.logger.log(`Impersonation session ended for user ${currentUserId}`);

    return {
      message: 'Impersonation session ended. Please log in again.',
    };
  }
}
