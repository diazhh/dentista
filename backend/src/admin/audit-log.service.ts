import { Injectable, Logger } from '@nestjs/common';
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

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  tenantId?: string;
  action?: AuditAction;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

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

  /**
   * Export audit logs to CSV format
   */
  async exportToCsv(filters: AuditLogFilters): Promise<string> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit export to 10k records
      include: {
        user: {
          select: { name: true, email: true },
        },
        tenant: {
          select: { name: true },
        },
      },
    });

    // Build CSV
    const headers = [
      'ID',
      'Date',
      'User Name',
      'User Email',
      'Tenant',
      'Action',
      'Entity',
      'Entity ID',
      'IP Address',
      'User Agent',
      'Changes',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.user?.name || '',
      log.user?.email || '',
      log.tenant?.name || '',
      log.action,
      log.entity,
      log.entityId || '',
      log.ipAddress || '',
      log.userAgent || '',
      log.changes ? JSON.stringify(log.changes) : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * Get suspicious activity alerts
   */
  async getSuspiciousActivity(params: { hours?: number } = {}): Promise<any[]> {
    const hoursBack = params.hours || 24;
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const alerts: any[] = [];

    // 1. Multiple failed logins from same user
    const failedLogins = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        action: 'LOGIN',
        createdAt: { gte: since },
        metadata: { path: ['success'], equals: false },
      },
      _count: true,
      having: {
        userId: {
          _count: { gte: 5 },
        },
      },
    });

    for (const fl of failedLogins) {
      const user = await this.prisma.user.findUnique({
        where: { id: fl.userId },
        select: { name: true, email: true },
      });
      alerts.push({
        type: 'MULTIPLE_FAILED_LOGINS',
        severity: 'HIGH',
        message: `User ${user?.email} has ${fl._count} failed login attempts in the last ${hoursBack} hours`,
        userId: fl.userId,
        count: fl._count,
        detectedAt: new Date(),
      });
    }

    // 2. Mass deletions
    const massDeletes = await this.prisma.auditLog.groupBy({
      by: ['userId', 'entity'],
      where: {
        action: 'DELETE',
        createdAt: { gte: since },
      },
      _count: true,
      having: {
        userId: {
          _count: { gte: 10 },
        },
      },
    });

    for (const md of massDeletes) {
      const user = await this.prisma.user.findUnique({
        where: { id: md.userId },
        select: { name: true, email: true },
      });
      alerts.push({
        type: 'MASS_DELETION',
        severity: 'CRITICAL',
        message: `User ${user?.email} deleted ${md._count} ${md.entity} records in the last ${hoursBack} hours`,
        userId: md.userId,
        entity: md.entity,
        count: md._count,
        detectedAt: new Date(),
      });
    }

    // 3. Unusual impersonation activity
    const impersonations = await this.prisma.auditLog.findMany({
      where: {
        action: 'IMPERSONATE',
        createdAt: { gte: since },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (impersonations.length > 5) {
      alerts.push({
        type: 'FREQUENT_IMPERSONATION',
        severity: 'MEDIUM',
        message: `${impersonations.length} impersonation events in the last ${hoursBack} hours`,
        count: impersonations.length,
        detectedAt: new Date(),
      });
    }

    // 4. Activity outside business hours (if metadata contains timestamp)
    const afterHoursActivity = await this.prisma.auditLog.count({
      where: {
        createdAt: { gte: since },
        OR: [
          {
            createdAt: {
              gte: new Date(new Date().setHours(22, 0, 0, 0)),
            },
          },
          {
            createdAt: {
              lte: new Date(new Date().setHours(6, 0, 0, 0)),
            },
          },
        ],
      },
    });

    if (afterHoursActivity > 50) {
      alerts.push({
        type: 'AFTER_HOURS_ACTIVITY',
        severity: 'LOW',
        message: `${afterHoursActivity} actions occurred outside business hours (10pm-6am)`,
        count: afterHoursActivity,
        detectedAt: new Date(),
      });
    }

    this.logger.log(`Found ${alerts.length} suspicious activity alerts`);

    return alerts.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (severityOrder[a.severity as keyof typeof severityOrder] || 4) -
        (severityOrder[b.severity as keyof typeof severityOrder] || 4);
    });
  }

  /**
   * Get activity timeline for a specific user
   */
  async getUserTimeline(userId: string, days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        tenant: {
          select: { name: true },
        },
      },
    });

    // Group by day
    const timeline = new Map<string, any[]>();

    for (const log of logs) {
      const day = log.createdAt.toISOString().split('T')[0];
      if (!timeline.has(day)) {
        timeline.set(day, []);
      }
      timeline.get(day)!.push({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        tenant: log.tenant?.name,
        time: log.createdAt.toISOString(),
        ipAddress: log.ipAddress,
      });
    }

    return {
      userId,
      days,
      totalActions: logs.length,
      timeline: Object.fromEntries(timeline),
    };
  }

  /**
   * Get entity history
   */
  async getEntityHistory(entity: string, entityId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      entity,
      entityId,
      history: logs.map((log) => ({
        id: log.id,
        action: log.action,
        user: log.user,
        changes: log.changes,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress,
      })),
    };
  }
}
