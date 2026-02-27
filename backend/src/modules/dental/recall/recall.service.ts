import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDentalRecallDto, UpdateDentalRecallDto } from './dto/recall.dto';

@Injectable()
export class RecallService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateDentalRecallDto) {
    return this.prisma.dentalRecall.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        recallType: dto.recallType,
        intervalMonths: dto.intervalMonths,
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
      },
    });
  }

  async findAllByPatient(patientId: string, tenantId: string) {
    return this.prisma.dentalRecall.findMany({
      where: { patientId, tenantId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOverdue(tenantId: string) {
    return this.prisma.dentalRecall.findMany({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findUpcoming(tenantId: string, days = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.dentalRecall.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        dueDate: { gte: now, lte: futureDate },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.dentalRecall.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Dental recall not found');
    }

    return item;
  }

  async update(id: string, tenantId: string, dto: UpdateDentalRecallDto) {
    const item = await this.prisma.dentalRecall.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Dental recall not found');
    }

    return this.prisma.dentalRecall.update({
      where: { id },
      data: {
        recallType: dto.recallType,
        intervalMonths: dto.intervalMonths,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        reminderChannel: dto.reminderChannel,
        notes: dto.notes,
      },
    });
  }

  async markCompleted(id: string, tenantId: string, appointmentId: string) {
    const item = await this.prisma.dentalRecall.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Dental recall not found');
    }

    const now = new Date();
    const nextDueDate = new Date(now);
    nextDueDate.setMonth(nextDueDate.getMonth() + item.intervalMonths);

    return this.prisma.dentalRecall.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        lastCompletedDate: now,
        lastAppointmentId: appointmentId,
        dueDate: nextDueDate,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const item = await this.prisma.dentalRecall.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Dental recall not found');
    }

    await this.prisma.dentalRecall.delete({ where: { id } });

    return { message: 'Dental recall deleted successfully' };
  }
}
