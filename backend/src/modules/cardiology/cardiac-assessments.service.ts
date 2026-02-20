import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCardiacAssessmentDto, UpdateCardiacAssessmentDto } from './dto/cardiac-assessments.dto';

@Injectable()
export class CardiacAssessmentsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateCardiacAssessmentDto) {
    return this.prisma.cardiacAssessment.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        assessmentType: dto.assessmentType || 'INITIAL',
        bloodPressureSystolic: dto.bloodPressureSystolic,
        bloodPressureDiastolic: dto.bloodPressureDiastolic,
        heartRate: dto.heartRate,
        rhythm: dto.rhythm,
        ecgFindings: dto.ecgFindings,
        echoFindings: dto.echoFindings
          ? JSON.parse(JSON.stringify(dto.echoFindings))
          : undefined,
        lipidPanel: dto.lipidPanel
          ? JSON.parse(JSON.stringify(dto.lipidPanel))
          : undefined,
        riskFactors: dto.riskFactors,
        riskScore: dto.riskScore,
        medications: dto.medications
          ? JSON.parse(JSON.stringify(dto.medications))
          : undefined,
        diagnosis: dto.diagnosis,
        plan: dto.plan,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.cardiacAssessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.cardiacAssessment.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Cardiac assessment not found');
    }

    return item;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateCardiacAssessmentDto) {
    const item = await this.prisma.cardiacAssessment.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Cardiac assessment not found');
    }

    return this.prisma.cardiacAssessment.update({
      where: { id },
      data: {
        assessmentType: dto.assessmentType,
        bloodPressureSystolic: dto.bloodPressureSystolic,
        bloodPressureDiastolic: dto.bloodPressureDiastolic,
        heartRate: dto.heartRate,
        rhythm: dto.rhythm,
        ecgFindings: dto.ecgFindings,
        echoFindings: dto.echoFindings
          ? JSON.parse(JSON.stringify(dto.echoFindings))
          : undefined,
        lipidPanel: dto.lipidPanel
          ? JSON.parse(JSON.stringify(dto.lipidPanel))
          : undefined,
        riskFactors: dto.riskFactors,
        riskScore: dto.riskScore,
        medications: dto.medications
          ? JSON.parse(JSON.stringify(dto.medications))
          : undefined,
        diagnosis: dto.diagnosis,
        plan: dto.plan,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.cardiacAssessment.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Cardiac assessment not found');
    }

    await this.prisma.cardiacAssessment.delete({ where: { id } });

    return { message: 'Cardiac assessment deleted successfully' };
  }
}
