import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFunctionalAssessmentDto, UpdateFunctionalAssessmentDto } from './dto/functional-assessments.dto';

@Injectable()
export class FunctionalAssessmentsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateFunctionalAssessmentDto) {
    return this.prisma.functionalAssessment.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        assessmentType: dto.assessmentType || 'INITIAL',
        rangeOfMotion: dto.rangeOfMotion
          ? JSON.parse(JSON.stringify(dto.rangeOfMotion))
          : undefined,
        painScale: dto.painScale,
        functionalScore: dto.functionalScore,
        mobility: dto.mobility
          ? JSON.parse(JSON.stringify(dto.mobility))
          : undefined,
        strength: dto.strength
          ? JSON.parse(JSON.stringify(dto.strength))
          : undefined,
        balance: dto.balance
          ? JSON.parse(JSON.stringify(dto.balance))
          : undefined,
        goals: dto.goals
          ? JSON.parse(JSON.stringify(dto.goals))
          : undefined,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.functionalAssessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.functionalAssessment.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Functional assessment not found');
    }

    return item;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateFunctionalAssessmentDto) {
    const item = await this.prisma.functionalAssessment.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Functional assessment not found');
    }

    return this.prisma.functionalAssessment.update({
      where: { id },
      data: {
        assessmentType: dto.assessmentType,
        rangeOfMotion: dto.rangeOfMotion
          ? JSON.parse(JSON.stringify(dto.rangeOfMotion))
          : undefined,
        painScale: dto.painScale,
        functionalScore: dto.functionalScore,
        mobility: dto.mobility
          ? JSON.parse(JSON.stringify(dto.mobility))
          : undefined,
        strength: dto.strength
          ? JSON.parse(JSON.stringify(dto.strength))
          : undefined,
        balance: dto.balance
          ? JSON.parse(JSON.stringify(dto.balance))
          : undefined,
        goals: dto.goals
          ? JSON.parse(JSON.stringify(dto.goals))
          : undefined,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.functionalAssessment.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Functional assessment not found');
    }

    await this.prisma.functionalAssessment.delete({ where: { id } });

    return { message: 'Functional assessment deleted successfully' };
  }
}
