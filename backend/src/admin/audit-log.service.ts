import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface CreateAuditLogDto {
  userId: string;
  tenantId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
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

  async findAll(params: {
    page?: number;
    limit?: number;
    userId?: string;
    tenantId?: string;
    action?: AuditAction;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.userId) where.userId = params.userId;
    if (params.tenantId) where.tenantId = params.tenantId;
    if (params.action) where.action = params.action;
    if (params.entity) where.entity = params.entity;
    
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
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

  async getStatistics(params: { startDate?: Date; endDate?: Date }) {
    const where: any = {};
    
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [totalLogs, actionCounts, entityCounts, topUsers] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: true,
      }),
      
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const topUsersWithDetails = await this.prisma.user.findMany({
      where: {
        id: {
          in: topUsers.map((u) => u.userId),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return {
      totalLogs,
      actionCounts: actionCounts.map((ac) => ({
        action: ac.action,
        count: ac._count,
      })),
      entityCounts: entityCounts.map((ec) => ({
        entity: ec.entity,
        count: ec._count,
      })),
      topUsers: topUsers.map((tu) => {
        const user = topUsersWithDetails.find((u) => u.id === tu.userId);
        return {
          userId: tu.userId,
          user,
          count: tu._count,
        };
      }),
    };
  }
}
