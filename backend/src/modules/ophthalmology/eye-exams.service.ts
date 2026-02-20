import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEyeExamDto, UpdateEyeExamDto } from './dto/eye-exams.dto';

@Injectable()
export class EyeExamsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateEyeExamDto) {
    return this.prisma.eyeExam.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        examType: dto.examType || 'COMPREHENSIVE',
        visualAcuityRight: dto.visualAcuityRight,
        visualAcuityLeft: dto.visualAcuityLeft,
        intraocularPressureRight: dto.intraocularPressureRight,
        intraocularPressureLeft: dto.intraocularPressureLeft,
        pupilResponse: dto.pupilResponse,
        anteriorSegment: dto.anteriorSegment
          ? JSON.parse(JSON.stringify(dto.anteriorSegment))
          : undefined,
        posteriorSegment: dto.posteriorSegment
          ? JSON.parse(JSON.stringify(dto.posteriorSegment))
          : undefined,
        fundoscopy: dto.fundoscopy
          ? JSON.parse(JSON.stringify(dto.fundoscopy))
          : undefined,
        colorVision: dto.colorVision,
        peripheralVision: dto.peripheralVision,
        diagnosis: dto.diagnosis,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.eyeExam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.eyeExam.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Eye exam not found');
    }

    return item;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateEyeExamDto) {
    const item = await this.prisma.eyeExam.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Eye exam not found');
    }

    return this.prisma.eyeExam.update({
      where: { id },
      data: {
        examType: dto.examType,
        visualAcuityRight: dto.visualAcuityRight,
        visualAcuityLeft: dto.visualAcuityLeft,
        intraocularPressureRight: dto.intraocularPressureRight,
        intraocularPressureLeft: dto.intraocularPressureLeft,
        pupilResponse: dto.pupilResponse,
        anteriorSegment: dto.anteriorSegment
          ? JSON.parse(JSON.stringify(dto.anteriorSegment))
          : undefined,
        posteriorSegment: dto.posteriorSegment
          ? JSON.parse(JSON.stringify(dto.posteriorSegment))
          : undefined,
        fundoscopy: dto.fundoscopy
          ? JSON.parse(JSON.stringify(dto.fundoscopy))
          : undefined,
        colorVision: dto.colorVision,
        peripheralVision: dto.peripheralVision,
        diagnosis: dto.diagnosis,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.eyeExam.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Eye exam not found');
    }

    await this.prisma.eyeExam.delete({ where: { id } });

    return { message: 'Eye exam deleted successfully' };
  }
}
