import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class PlansService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    const plans = await this.prisma.subscriptionPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return plans;
  }

  async findById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async create(data: {
    name: string;
    code: string;
    description?: string;
    monthlyPrice: number;
    yearlyPrice?: number;
    currency?: string;
    maxPatients: number;
    maxUsers: number;
    storageGB: number;
    features?: string[];
    isPublic?: boolean;
    sortOrder?: number;
  }, userId: string) {
    // Check if code already exists
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new BadRequestException('Plan code already exists');
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        currency: data.currency || 'USD',
        maxPatients: data.maxPatients,
        maxUsers: data.maxUsers,
        storageGB: data.storageGB,
        features: data.features || [],
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        sortOrder: data.sortOrder || 0,
        isActive: true,
      },
    });

    await this.auditLogService.create({
      userId,
      action: 'CREATE',
      entity: 'SubscriptionPlan',
      entityId: plan.id,
      metadata: {
        planName: plan.name,
        planCode: plan.code,
      },
    });

    return plan;
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    monthlyPrice?: number;
    yearlyPrice?: number;
    maxPatients?: number;
    maxUsers?: number;
    storageGB?: number;
    features?: string[];
    isPublic?: boolean;
    sortOrder?: number;
  }, userId: string) {
    const plan = await this.findById(id);

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        maxPatients: data.maxPatients,
        maxUsers: data.maxUsers,
        storageGB: data.storageGB,
        features: data.features,
        isPublic: data.isPublic,
        sortOrder: data.sortOrder,
      },
    });

    await this.auditLogService.create({
      userId,
      action: 'UPDATE',
      entity: 'SubscriptionPlan',
      entityId: plan.id,
      metadata: {
        planName: updated.name,
        changes: data,
      },
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const plan = await this.findById(id);

    // Check if any tenants are using this plan
    const tenantsCount = await this.prisma.tenant.count({
      where: { subscriptionTier: plan.code as any },
    });

    if (tenantsCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan. ${tenantsCount} tenant(s) are currently using this plan.`
      );
    }

    await this.prisma.subscriptionPlan.delete({
      where: { id },
    });

    await this.auditLogService.create({
      userId,
      action: 'DELETE',
      entity: 'SubscriptionPlan',
      entityId: plan.id,
      metadata: {
        planName: plan.name,
        planCode: plan.code,
      },
    });

    return { message: 'Plan deleted successfully', plan };
  }

  async activate(id: string, userId: string) {
    const plan = await this.findById(id);

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: true },
    });

    await this.auditLogService.create({
      userId,
      action: 'UPDATE',
      entity: 'SubscriptionPlan',
      entityId: plan.id,
      metadata: {
        planName: plan.name,
        action: 'activated',
      },
    });

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const plan = await this.findById(id);

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditLogService.create({
      userId,
      action: 'UPDATE',
      entity: 'SubscriptionPlan',
      entityId: plan.id,
      metadata: {
        planName: plan.name,
        action: 'deactivated',
      },
    });

    return updated;
  }

  async getStatistics() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.subscriptionPlan.count(),
      this.prisma.subscriptionPlan.count({ where: { isActive: true } }),
      this.prisma.subscriptionPlan.count({ where: { isActive: false } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}
