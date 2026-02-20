import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGynecologicalExamDto, UpdateGynecologicalExamDto } from './dto/gynecological-exams.dto';

@Injectable()
export class GynecologicalExamsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateGynecologicalExamDto) {
    return this.prisma.gynecologicalExam.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        examType: dto.examType || 'ROUTINE',
        lastMenstrualPeriod: dto.lastMenstrualPeriod,
        menstrualCycleLength: dto.menstrualCycleLength,
        menstrualRegularity: dto.menstrualRegularity,
        contraceptiveMethod: dto.contraceptiveMethod,
        pregnancyHistory: dto.pregnancyHistory
          ? JSON.parse(JSON.stringify(dto.pregnancyHistory))
          : undefined,
        currentPregnancy: dto.currentPregnancy
          ? JSON.parse(JSON.stringify(dto.currentPregnancy))
          : undefined,
        examFindings: dto.examFindings
          ? JSON.parse(JSON.stringify(dto.examFindings))
          : undefined,
        papSmearResult: dto.papSmearResult,
        ultrasoundFindings: dto.ultrasoundFindings
          ? JSON.parse(JSON.stringify(dto.ultrasoundFindings))
          : undefined,
        labResults: dto.labResults
          ? JSON.parse(JSON.stringify(dto.labResults))
          : undefined,
        diagnosis: dto.diagnosis,
        plan: dto.plan,
        nextAppointmentDate: dto.nextAppointmentDate,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.gynecologicalExam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const exam = await this.prisma.gynecologicalExam.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!exam) {
      throw new NotFoundException('Gynecological exam not found');
    }

    return exam;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateGynecologicalExamDto) {
    const exam = await this.prisma.gynecologicalExam.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!exam) {
      throw new NotFoundException('Gynecological exam not found');
    }

    return this.prisma.gynecologicalExam.update({
      where: { id },
      data: {
        examType: dto.examType,
        lastMenstrualPeriod: dto.lastMenstrualPeriod,
        menstrualCycleLength: dto.menstrualCycleLength,
        menstrualRegularity: dto.menstrualRegularity,
        contraceptiveMethod: dto.contraceptiveMethod,
        pregnancyHistory: dto.pregnancyHistory
          ? JSON.parse(JSON.stringify(dto.pregnancyHistory))
          : undefined,
        currentPregnancy: dto.currentPregnancy
          ? JSON.parse(JSON.stringify(dto.currentPregnancy))
          : undefined,
        examFindings: dto.examFindings
          ? JSON.parse(JSON.stringify(dto.examFindings))
          : undefined,
        papSmearResult: dto.papSmearResult,
        ultrasoundFindings: dto.ultrasoundFindings
          ? JSON.parse(JSON.stringify(dto.ultrasoundFindings))
          : undefined,
        labResults: dto.labResults
          ? JSON.parse(JSON.stringify(dto.labResults))
          : undefined,
        diagnosis: dto.diagnosis,
        plan: dto.plan,
        nextAppointmentDate: dto.nextAppointmentDate,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const exam = await this.prisma.gynecologicalExam.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!exam) {
      throw new NotFoundException('Gynecological exam not found');
    }

    await this.prisma.gynecologicalExam.delete({ where: { id } });

    return { message: 'Gynecological exam deleted successfully' };
  }
}
