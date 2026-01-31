import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PlanFeatures {
  maxPatients: number;
  storageGB: number;
  whatsappEnabled: boolean;
  appointmentReminders: boolean;
  treatmentPlans: boolean;
  invoicing: boolean;
  reports: boolean;
  multiLocation: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface PlanInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeatures;
}

const PLANS: Record<string, PlanInfo> = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para consultorios individuales',
    price: 29,
    currency: 'USD',
    interval: 'month',
    features: {
      maxPatients: 100,
      storageGB: 5,
      whatsappEnabled: false,
      appointmentReminders: true,
      treatmentPlans: true,
      invoicing: true,
      reports: false,
      multiLocation: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    description: 'Para clínicas en crecimiento',
    price: 79,
    currency: 'USD',
    interval: 'month',
    features: {
      maxPatients: 500,
      storageGB: 25,
      whatsappEnabled: true,
      appointmentReminders: true,
      treatmentPlans: true,
      invoicing: true,
      reports: true,
      multiLocation: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para clínicas multi-sede',
    price: 199,
    currency: 'USD',
    interval: 'month',
    features: {
      maxPatients: -1, // Unlimited
      storageGB: 100,
      whatsappEnabled: true,
      appointmentReminders: true,
      treatmentPlans: true,
      invoicing: true,
      reports: true,
      multiLocation: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
};

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getCurrentSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        maxPatients: true,
        storageGB: true,
        stripeCustomerId: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plan = PLANS[tenant.subscriptionTier] || PLANS.STARTER;

    // Calcular días restantes de trial si aplica
    let trialDaysRemaining: number | null = null;
    if (tenant.subscriptionStatus === 'TRIAL' && tenant.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(tenant.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Obtener uso actual
    const [patientCount, documentsSize] = await Promise.all([
      this.prisma.patient.count({
        where: {
          patientDentistRelations: {
            some: {
              tenantId,
              isActive: true,
            },
          },
        },
      }),
      this.getStorageUsage(tenantId),
    ]);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      subscription: {
        tier: tenant.subscriptionTier,
        status: tenant.subscriptionStatus,
        plan: plan,
        trialEndsAt: tenant.trialEndsAt,
        trialDaysRemaining,
        hasStripeSubscription: !!tenant.stripeCustomerId,
      },
      usage: {
        patients: {
          current: patientCount,
          limit: tenant.maxPatients,
          percentage: tenant.maxPatients > 0 ? Math.round((patientCount / tenant.maxPatients) * 100) : 0,
        },
        storage: {
          currentGB: documentsSize,
          limitGB: tenant.storageGB,
          percentage: tenant.storageGB > 0 ? Math.round((documentsSize / tenant.storageGB) * 100) : 0,
        },
      },
      features: plan.features,
    };
  }

  async getStorageUsage(tenantId: string): Promise<number> {
    // Calcular tamaño total de documentos (en GB)
    const documents = await this.prisma.document.aggregate({
      where: { tenantId },
      _sum: {
        fileSize: true,
      },
    });

    const totalBytes = documents._sum.fileSize || 0;
    return Math.round((totalBytes / (1024 * 1024 * 1024)) * 100) / 100; // GB con 2 decimales
  }

  async getAllPlans() {
    return Object.values(PLANS);
  }

  async checkFeatureAccess(tenantId: string, feature: keyof PlanFeatures): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    if (!tenant) {
      return false;
    }

    // Si está cancelado o vencido, no tiene acceso
    if (tenant.subscriptionStatus === 'CANCELLED') {
      return false;
    }

    const plan = PLANS[tenant.subscriptionTier] || PLANS.STARTER;
    return plan.features[feature] === true || plan.features[feature] === -1;
  }

  async checkPatientLimit(tenantId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxPatients: true },
    });

    if (!tenant) {
      return { allowed: false, current: 0, limit: 0 };
    }

    const patientCount = await this.prisma.patient.count({
      where: {
        patientDentistRelations: {
          some: {
            tenantId,
            isActive: true,
          },
        },
      },
    });

    // -1 significa ilimitado
    const allowed = tenant.maxPatients === -1 || patientCount < tenant.maxPatients;

    return {
      allowed,
      current: patientCount,
      limit: tenant.maxPatients,
    };
  }
}
