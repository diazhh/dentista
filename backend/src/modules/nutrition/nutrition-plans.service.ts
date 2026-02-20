import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNutritionPlanDto, UpdateNutritionPlanDto } from './dto/nutrition-plans.dto';

@Injectable()
export class NutritionPlansService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateNutritionPlanDto) {
    return this.prisma.nutritionPlan.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        title: dto.title,
        objective: dto.objective,
        dailyCalories: dto.dailyCalories,
        macros: dto.macros
          ? JSON.parse(JSON.stringify(dto.macros))
          : undefined,
        meals: dto.meals
          ? JSON.parse(JSON.stringify(dto.meals))
          : undefined,
        restrictions: dto.restrictions,
        supplements: dto.supplements,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status || 'ACTIVE',
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.nutritionPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException('Nutrition plan not found');
    }

    return plan;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateNutritionPlanDto) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException('Nutrition plan not found');
    }

    return this.prisma.nutritionPlan.update({
      where: { id },
      data: {
        title: dto.title,
        objective: dto.objective,
        dailyCalories: dto.dailyCalories,
        macros: dto.macros
          ? JSON.parse(JSON.stringify(dto.macros))
          : undefined,
        meals: dto.meals
          ? JSON.parse(JSON.stringify(dto.meals))
          : undefined,
        restrictions: dto.restrictions,
        supplements: dto.supplements,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException('Nutrition plan not found');
    }

    await this.prisma.nutritionPlan.delete({ where: { id } });

    return { message: 'Nutrition plan deleted successfully' };
  }
}
