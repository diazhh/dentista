import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/assessments.dto';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateAssessmentDto) {
    const { score, severity } = this.calculateScoring(dto.assessmentType, dto.responses);

    return this.prisma.psychologicalAssessment.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        assessmentType: dto.assessmentType,
        responses: JSON.parse(JSON.stringify(dto.responses)),
        score,
        interpretation: dto.interpretation,
        severity,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.psychologicalAssessment.findMany({
      where,
      orderBy: { administeredAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const assessment = await this.prisma.psychologicalAssessment.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!assessment) {
      throw new NotFoundException('Psychological assessment not found');
    }

    return assessment;
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const assessment = await this.prisma.psychologicalAssessment.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!assessment) {
      throw new NotFoundException('Psychological assessment not found');
    }

    await this.prisma.psychologicalAssessment.delete({ where: { id } });

    return { message: 'Psychological assessment deleted successfully' };
  }

  /**
   * Auto-calculate score and severity for known assessment types.
   * For PHQ-9: sum of 9 items (0-3 each), max 27.
   * For GAD-7: sum of 7 items (0-3 each), max 21.
   * For other types: sum all numeric values as score, severity = null.
   */
  private calculateScoring(
    assessmentType: string,
    responses: Record<string, any>,
  ): { score: number; severity: string | null } {
    const values = Object.values(responses).filter(
      (v) => typeof v === 'number',
    );
    const score = values.reduce((sum, val) => sum + val, 0);

    const upperType = assessmentType.toUpperCase();

    if (upperType === 'PHQ9' || upperType === 'PHQ-9') {
      return { score, severity: this.phq9Severity(score) };
    }

    if (upperType === 'GAD7' || upperType === 'GAD-7') {
      return { score, severity: this.gad7Severity(score) };
    }

    // Unknown assessment type: return raw score, no severity
    return { score, severity: null };
  }

  private phq9Severity(score: number): string {
    if (score <= 4) return 'MINIMAL';
    if (score <= 9) return 'MILD';
    if (score <= 14) return 'MODERATE';
    if (score <= 19) return 'MODERATELY_SEVERE';
    return 'SEVERE';
  }

  private gad7Severity(score: number): string {
    if (score <= 4) return 'MINIMAL';
    if (score <= 9) return 'MILD';
    if (score <= 14) return 'MODERATE';
    return 'SEVERE';
  }
}
