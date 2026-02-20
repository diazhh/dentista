import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLensPrescriptionDto, UpdateLensPrescriptionDto } from './dto/lens-prescriptions.dto';

@Injectable()
export class LensPrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateLensPrescriptionDto) {
    return this.prisma.lensPrescription.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        eyeExamId: dto.eyeExamId,
        rightSphere: dto.rightSphere,
        rightCylinder: dto.rightCylinder,
        rightAxis: dto.rightAxis,
        rightAdd: dto.rightAdd,
        rightPd: dto.rightPd,
        leftSphere: dto.leftSphere,
        leftCylinder: dto.leftCylinder,
        leftAxis: dto.leftAxis,
        leftAdd: dto.leftAdd,
        leftPd: dto.leftPd,
        prescriptionType: dto.prescriptionType || 'GLASSES',
        material: dto.material,
        coatings: dto.coatings,
        expiresAt: dto.expiresAt,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.lensPrescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.lensPrescription.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Lens prescription not found');
    }

    return item;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateLensPrescriptionDto) {
    const item = await this.prisma.lensPrescription.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Lens prescription not found');
    }

    return this.prisma.lensPrescription.update({
      where: { id },
      data: {
        eyeExamId: dto.eyeExamId,
        rightSphere: dto.rightSphere,
        rightCylinder: dto.rightCylinder,
        rightAxis: dto.rightAxis,
        rightAdd: dto.rightAdd,
        rightPd: dto.rightPd,
        leftSphere: dto.leftSphere,
        leftCylinder: dto.leftCylinder,
        leftAxis: dto.leftAxis,
        leftAdd: dto.leftAdd,
        leftPd: dto.leftPd,
        prescriptionType: dto.prescriptionType,
        material: dto.material,
        coatings: dto.coatings,
        expiresAt: dto.expiresAt,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.lensPrescription.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Lens prescription not found');
    }

    await this.prisma.lensPrescription.delete({ where: { id } });

    return { message: 'Lens prescription deleted successfully' };
  }
}
