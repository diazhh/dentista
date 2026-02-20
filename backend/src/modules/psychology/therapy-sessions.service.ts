import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTherapySessionDto, UpdateTherapySessionDto } from './dto/therapy-sessions.dto';

@Injectable()
export class TherapySessionsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateTherapySessionDto) {
    // Auto-calculate sessionNumber: count existing sessions for this patient+provider+tenant + 1
    const existingCount = await this.prisma.therapySession.count({
      where: {
        patientId: dto.patientId,
        providerId,
        tenantId,
      },
    });

    const sessionNumber = existingCount + 1;

    return this.prisma.therapySession.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        appointmentId: dto.appointmentId,
        sessionNumber,
        sessionType: dto.sessionType || 'INDIVIDUAL',
        duration: dto.duration || 50,
        notes: dto.notes,
        techniques: dto.techniques || [],
        homework: dto.homework,
        progress: dto.progress,
        moodRating: dto.moodRating,
        riskLevel: dto.riskLevel || 'NONE',
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.therapySession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const session = await this.prisma.therapySession.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Therapy session not found');
    }

    return session;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateTherapySessionDto) {
    const session = await this.prisma.therapySession.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Therapy session not found');
    }

    return this.prisma.therapySession.update({
      where: { id },
      data: {
        sessionType: dto.sessionType,
        duration: dto.duration,
        notes: dto.notes,
        techniques: dto.techniques,
        homework: dto.homework,
        progress: dto.progress,
        moodRating: dto.moodRating,
        riskLevel: dto.riskLevel,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const session = await this.prisma.therapySession.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Therapy session not found');
    }

    await this.prisma.therapySession.delete({ where: { id } });

    return { message: 'Therapy session deleted successfully' };
  }
}
