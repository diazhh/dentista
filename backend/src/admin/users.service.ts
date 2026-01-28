import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private jwtService: JwtService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    role?: string;
    search?: string;
  }) {
    const { page, limit, role, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              tenantMemberships: true,
              ownedTenants: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStatistics() {
    const [
      totalUsers,
      usersByRole,
      usersThisMonth,
      activeUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          sessions: {
            some: {
              expiresAt: {
                gte: new Date(),
              },
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      usersByRole,
      usersThisMonth,
      activeUsers,
    };
  }

  async create(
    adminUserId: string,
    data: {
      email: string;
      name: string;
      password: string;
      role: string;
      phone?: string;
    },
  ) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: data.role as any,
        phone: data.phone,
      },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      metadata: {
        email: data.email,
        role: data.role,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenantMemberships: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                subscriptionTier: true,
                subscriptionStatus: true,
              },
            },
          },
        },
        ownedTenants: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        },
        sessions: {
          where: {
            expiresAt: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async update(id: string, adminUserId: string, data: any) {
    const before = await this.prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role }),
        ...(data.phone && { phone: data.phone }),
      },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      changes: { before, after: data },
    });

    const { passwordHash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async delete(id: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
    });

    return { message: 'User deleted successfully' };
  }

  async impersonate(userId: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantMemberships: {
          where: {
            status: 'ACTIVE',
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create impersonation token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantMemberships[0]?.tenantId || null,
      impersonatedBy: adminUserId,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'IMPERSONATE',
      entity: 'User',
      entityId: userId,
      metadata: {
        impersonatedUser: user.email,
      },
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
