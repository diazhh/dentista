import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreatePeriodontalExamDto,
  UpdatePeriodontalExamDto,
  CreatePeriodontalReadingDto,
} from './dto/periodontal.dto';

@Injectable()
export class PeriodontalService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreatePeriodontalExamDto) {
    const { readings, ...examData } = dto;

    return this.prisma.periodontalExam.create({
      data: {
        patientId: examData.patientId,
        providerId,
        tenantId,
        examType: examData.examType || 'COMPREHENSIVE',
        notes: examData.notes,
        diagnosis: examData.diagnosis,
        overallPlaque: examData.overallPlaque,
        overallBleeding: examData.overallBleeding,
        readings: readings?.length
          ? {
              create: readings.map((r) => ({
                toothNumber: r.toothNumber,
                pocketDepthBuccal: r.pocketDepthBuccal,
                gingivalMarginBuccal: r.gingivalMarginBuccal,
                bleedingBuccal: r.bleedingBuccal,
                pocketDepthLingual: r.pocketDepthLingual,
                gingivalMarginLingual: r.gingivalMarginLingual,
                bleedingLingual: r.bleedingLingual,
                plaque: r.plaque ?? false,
                calculus: r.calculus ?? false,
                suppuration: r.suppuration ?? false,
                furcation: r.furcation,
                mobility: r.mobility,
                notes: r.notes,
              })),
            }
          : undefined,
      },
      include: { readings: true },
    });
  }

  async findAllByPatient(patientId: string, tenantId: string) {
    return this.prisma.periodontalExam.findMany({
      where: { patientId, tenantId },
      include: {
        readings: { orderBy: { toothNumber: 'asc' } },
      },
      orderBy: { examDate: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const exam = await this.prisma.periodontalExam.findFirst({
      where: { id, tenantId },
      include: {
        readings: { orderBy: { toothNumber: 'asc' } },
      },
    });

    if (!exam) {
      throw new NotFoundException('Periodontal exam not found');
    }

    return exam;
  }

  async update(id: string, tenantId: string, dto: UpdatePeriodontalExamDto) {
    const exam = await this.prisma.periodontalExam.findFirst({
      where: { id, tenantId },
    });

    if (!exam) {
      throw new NotFoundException('Periodontal exam not found');
    }

    return this.prisma.periodontalExam.update({
      where: { id },
      data: {
        examType: dto.examType,
        notes: dto.notes,
        diagnosis: dto.diagnosis,
        overallPlaque: dto.overallPlaque,
        overallBleeding: dto.overallBleeding,
      },
      include: { readings: true },
    });
  }

  async delete(id: string, tenantId: string) {
    const exam = await this.prisma.periodontalExam.findFirst({
      where: { id, tenantId },
    });

    if (!exam) {
      throw new NotFoundException('Periodontal exam not found');
    }

    await this.prisma.periodontalExam.delete({ where: { id } });

    return { message: 'Periodontal exam deleted successfully' };
  }

  async addReading(examId: string, dto: CreatePeriodontalReadingDto) {
    // Verify exam exists
    const exam = await this.prisma.periodontalExam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Periodontal exam not found');
    }

    // Upsert: update existing reading for this tooth or create new one
    return this.prisma.periodontalReading.upsert({
      where: {
        examId_toothNumber: {
          examId,
          toothNumber: dto.toothNumber,
        },
      },
      update: {
        pocketDepthBuccal: dto.pocketDepthBuccal,
        gingivalMarginBuccal: dto.gingivalMarginBuccal,
        bleedingBuccal: dto.bleedingBuccal,
        pocketDepthLingual: dto.pocketDepthLingual,
        gingivalMarginLingual: dto.gingivalMarginLingual,
        bleedingLingual: dto.bleedingLingual,
        plaque: dto.plaque ?? false,
        calculus: dto.calculus ?? false,
        suppuration: dto.suppuration ?? false,
        furcation: dto.furcation,
        mobility: dto.mobility,
        notes: dto.notes,
      },
      create: {
        examId,
        toothNumber: dto.toothNumber,
        pocketDepthBuccal: dto.pocketDepthBuccal,
        gingivalMarginBuccal: dto.gingivalMarginBuccal,
        bleedingBuccal: dto.bleedingBuccal,
        pocketDepthLingual: dto.pocketDepthLingual,
        gingivalMarginLingual: dto.gingivalMarginLingual,
        bleedingLingual: dto.bleedingLingual,
        plaque: dto.plaque ?? false,
        calculus: dto.calculus ?? false,
        suppuration: dto.suppuration ?? false,
        furcation: dto.furcation,
        mobility: dto.mobility,
        notes: dto.notes,
      },
    });
  }

  async getComparison(patientId: string, tenantId: string) {
    // Get last 2 exams for the patient
    const exams = await this.prisma.periodontalExam.findMany({
      where: { patientId, tenantId },
      include: {
        readings: { orderBy: { toothNumber: 'asc' } },
      },
      orderBy: { examDate: 'desc' },
      take: 2,
    });

    if (exams.length === 0) {
      throw new NotFoundException('No periodontal exams found for this patient');
    }

    if (exams.length === 1) {
      return {
        current: exams[0],
        previous: null,
        comparison: null,
      };
    }

    const [current, previous] = exams;

    // Build comparison data per tooth
    const currentMap = new Map(
      current.readings.map((r) => [r.toothNumber, r]),
    );
    const previousMap = new Map(
      previous.readings.map((r) => [r.toothNumber, r]),
    );

    const allTeeth = new Set([
      ...currentMap.keys(),
      ...previousMap.keys(),
    ]);

    const toothComparisons = Array.from(allTeeth)
      .sort((a, b) => a - b)
      .map((toothNumber) => {
        const curr = currentMap.get(toothNumber);
        const prev = previousMap.get(toothNumber);

        return {
          toothNumber,
          current: curr || null,
          previous: prev || null,
          changes: curr && prev ? this.computeToothChanges(curr, prev) : null,
        };
      });

    return {
      current: {
        id: current.id,
        examDate: current.examDate,
        examType: current.examType,
        diagnosis: current.diagnosis,
        overallPlaque: current.overallPlaque,
        overallBleeding: current.overallBleeding,
      },
      previous: {
        id: previous.id,
        examDate: previous.examDate,
        examType: previous.examType,
        diagnosis: previous.diagnosis,
        overallPlaque: previous.overallPlaque,
        overallBleeding: previous.overallBleeding,
      },
      comparison: {
        plaqueChange:
          current.overallPlaque != null && previous.overallPlaque != null
            ? current.overallPlaque - previous.overallPlaque
            : null,
        bleedingChange:
          current.overallBleeding != null && previous.overallBleeding != null
            ? current.overallBleeding - previous.overallBleeding
            : null,
        teeth: toothComparisons,
      },
    };
  }

  private computeToothChanges(
    current: any,
    previous: any,
  ): Record<string, any> {
    const avgPocket = (depths: number[]) =>
      depths.length ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;

    const currAvgBuccal = avgPocket(current.pocketDepthBuccal);
    const prevAvgBuccal = avgPocket(previous.pocketDepthBuccal);
    const currAvgLingual = avgPocket(current.pocketDepthLingual);
    const prevAvgLingual = avgPocket(previous.pocketDepthLingual);

    const currBleedingCount = [
      ...current.bleedingBuccal,
      ...current.bleedingLingual,
    ].filter(Boolean).length;
    const prevBleedingCount = [
      ...previous.bleedingBuccal,
      ...previous.bleedingLingual,
    ].filter(Boolean).length;

    return {
      avgPocketDepthBuccalChange: +(currAvgBuccal - prevAvgBuccal).toFixed(1),
      avgPocketDepthLingualChange: +(currAvgLingual - prevAvgLingual).toFixed(1),
      bleedingSiteChange: currBleedingCount - prevBleedingCount,
      mobilityChange:
        current.mobility != null && previous.mobility != null
          ? current.mobility - previous.mobility
          : null,
    };
  }
}
