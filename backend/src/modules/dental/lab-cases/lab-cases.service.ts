import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateLabCaseDto,
  UpdateLabCaseDto,
  UpdateLabCaseStatusDto,
} from './dto/lab-cases.dto';

@Injectable()
export class LabCasesService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateLabCaseDto) {
    return this.prisma.labCase.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        appointmentId: dto.appointmentId,
        labName: dto.labName,
        labPhone: dto.labPhone,
        caseNumber: dto.caseNumber,
        workType: dto.workType,
        toothNumbers: dto.toothNumbers ?? [],
        shade: dto.shade,
        material: dto.material,
        specifications: dto.specifications,
        notes: dto.notes,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        labFee: dto.labFee,
        patientFee: dto.patientFee,
      },
    });
  }

  async findAllByPatient(patientId: string, tenantId: string) {
    return this.prisma.labCase.findMany({
      where: { patientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByProvider(
    providerId: string,
    tenantId: string,
    filters?: { status?: string },
  ) {
    const where: any = { providerId, tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.labCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const labCase = await this.prisma.labCase.findFirst({
      where: { id, tenantId },
    });

    if (!labCase) {
      throw new NotFoundException('Lab case not found');
    }

    return labCase;
  }

  async update(id: string, tenantId: string, dto: UpdateLabCaseDto) {
    const labCase = await this.prisma.labCase.findFirst({
      where: { id, tenantId },
    });

    if (!labCase) {
      throw new NotFoundException('Lab case not found');
    }

    return this.prisma.labCase.update({
      where: { id },
      data: {
        labName: dto.labName,
        labPhone: dto.labPhone,
        caseNumber: dto.caseNumber,
        workType: dto.workType,
        toothNumbers: dto.toothNumbers,
        shade: dto.shade,
        material: dto.material,
        specifications: dto.specifications,
        notes: dto.notes,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        receivedDate: dto.receivedDate
          ? new Date(dto.receivedDate)
          : undefined,
        seatedDate: dto.seatedDate ? new Date(dto.seatedDate) : undefined,
        labFee: dto.labFee,
        patientFee: dto.patientFee,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const labCase = await this.prisma.labCase.findFirst({
      where: { id, tenantId },
    });

    if (!labCase) {
      throw new NotFoundException('Lab case not found');
    }

    await this.prisma.labCase.delete({ where: { id } });

    return { message: 'Lab case deleted successfully' };
  }

  async updateStatus(
    id: string,
    tenantId: string,
    dto: UpdateLabCaseStatusDto,
  ) {
    const labCase = await this.prisma.labCase.findFirst({
      where: { id, tenantId },
    });

    if (!labCase) {
      throw new NotFoundException('Lab case not found');
    }

    const data: any = { status: dto.status };

    if (dto.receivedDate) {
      data.receivedDate = new Date(dto.receivedDate);
    } else if (dto.status === 'RECEIVED' && !labCase.receivedDate) {
      data.receivedDate = new Date();
    }

    if (dto.seatedDate) {
      data.seatedDate = new Date(dto.seatedDate);
    } else if (dto.status === 'SEATED' && !labCase.seatedDate) {
      data.seatedDate = new Date();
    }

    return this.prisma.labCase.update({
      where: { id },
      data,
    });
  }
}
