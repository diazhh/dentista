import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { UpdateTreatmentItemDto } from './dto/update-treatment-item.dto';

@Injectable()
export class TreatmentPlansService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTreatmentPlanDto, providerId: string, tenantId: string) {
    // Verificar que el paciente tiene relación con el proveedor
    const relation = await this.prisma.providerPatientRelation.findFirst({
      where: {
        patientId: dto.patientId,
        providerId,
        isActive: true,
      },
    });

    if (!relation) {
      throw new ForbiddenException('Patient is not associated with this provider');
    }

    // Calcular costo total
    const totalCost = dto.items.reduce((sum, item) => sum + item.estimatedCost, 0);

    const treatmentPlan = await this.prisma.treatmentPlan.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        title: dto.title,
        description: dto.description,
        diagnosis: dto.diagnosis,
        status: dto.status || 'DRAFT',
        totalCost,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes,
        items: {
          create: dto.items.map(item => ({
            tooth: item.tooth,
            surface: item.surface,
            procedureCode: item.procedureCode,
            procedureName: item.procedureName,
            description: item.description,
            estimatedCost: item.estimatedCost,
            priority: item.priority,
            estimatedDuration: item.estimatedDuration,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });

    return treatmentPlan;
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = {
      providerId,
      tenantId,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.treatmentPlan.findMany({
      where,
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const treatmentPlan = await this.prisma.treatmentPlan.findFirst({
      where: {
        id,
        providerId,
        tenantId,
      },
      include: {
        items: {
          orderBy: {
            priority: 'desc',
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
            phone: true,
          },
        },
      },
    });

    if (!treatmentPlan) {
      throw new NotFoundException('Treatment plan not found');
    }

    return treatmentPlan;
  }

  async update(id: string, dto: UpdateTreatmentPlanDto, providerId: string, tenantId: string) {
    const treatmentPlan = await this.findOne(id, providerId, tenantId);

    let totalCost = treatmentPlan.totalCost;
    if (dto.items) {
      totalCost = dto.items.reduce((sum, item) => sum + item.estimatedCost, 0);
    }

    return this.prisma.treatmentPlan.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        diagnosis: dto.diagnosis,
        status: dto.status,
        totalCost,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
      },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });
  }

  async updateItem(itemId: string, dto: UpdateTreatmentItemDto, providerId: string, tenantId: string) {
    const item = await this.prisma.treatmentPlanItem.findUnique({
      where: { id: itemId },
      include: {
        treatmentPlan: true,
      },
    });

    if (!item || item.treatmentPlan.providerId !== providerId || item.treatmentPlan.tenantId !== tenantId) {
      throw new NotFoundException('Treatment plan item not found');
    }

    return this.prisma.treatmentPlanItem.update({
      where: { id: itemId },
      data: {
        status: dto.status,
        actualCost: dto.actualCost,
      },
    });
  }

  async remove(id: string, providerId: string, tenantId: string) {
    await this.findOne(id, providerId, tenantId);

    return this.prisma.treatmentPlan.delete({
      where: { id },
    });
  }
}
