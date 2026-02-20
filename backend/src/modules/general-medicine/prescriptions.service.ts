import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/prescriptions.dto';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreatePrescriptionDto) {
    return this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        clinicalNoteId: dto.clinicalNoteId,
        medications: JSON.parse(JSON.stringify(dto.medications)),
        diagnosis: dto.diagnosis,
        notes: dto.notes,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    await this.prisma.prescription.delete({ where: { id } });

    return { message: 'Prescription deleted successfully' };
  }
}
