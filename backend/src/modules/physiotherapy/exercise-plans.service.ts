import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExercisePlanDto, UpdateExercisePlanDto } from './dto/exercise-plans.dto';

@Injectable()
export class ExercisePlansService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateExercisePlanDto) {
    return this.prisma.exercisePlan.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        title: dto.title,
        exercises: JSON.parse(JSON.stringify(dto.exercises)),
        frequency: dto.frequency,
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

    return this.prisma.exercisePlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.exercisePlan.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Exercise plan not found');
    }

    return item;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateExercisePlanDto) {
    const item = await this.prisma.exercisePlan.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Exercise plan not found');
    }

    return this.prisma.exercisePlan.update({
      where: { id },
      data: {
        title: dto.title,
        exercises: dto.exercises
          ? JSON.parse(JSON.stringify(dto.exercises))
          : undefined,
        frequency: dto.frequency,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status,
        progress: dto.progress
          ? JSON.parse(JSON.stringify(dto.progress))
          : undefined,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.exercisePlan.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Exercise plan not found');
    }

    await this.prisma.exercisePlan.delete({ where: { id } });

    return { message: 'Exercise plan deleted successfully' };
  }
}
