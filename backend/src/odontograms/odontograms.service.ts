import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOdontogramDto, CreateToothDto } from './dto/create-odontogram.dto';
import { UpdateOdontogramDto } from './dto/update-odontogram.dto';

@Injectable()
export class OdontogramsService {
  constructor(private prisma: PrismaService) {}

  async create(createOdontogramDto: CreateOdontogramDto, providerId: string, tenantId: string) {
    const relation = await this.prisma.providerPatientRelation.findFirst({
      where: {
        patientId: createOdontogramDto.patientId,
        providerId: providerId,
        tenantId,
      },
    });

    if (!relation) {
      throw new ForbiddenException('Patient not assigned to this provider');
    }

    const odontogram = await this.prisma.odontogram.create({
      data: {
        patientId: createOdontogramDto.patientId,
        providerId: providerId,
        tenantId,
        notes: createOdontogramDto.notes,
        teeth: createOdontogramDto.teeth
          ? {
              create: createOdontogramDto.teeth.map((tooth) => ({
                toothNumber: tooth.toothNumber,
                condition: tooth.condition,
                surfaces: tooth.surfaces || [],
                notes: tooth.notes,
                color: tooth.color,
              })),
            }
          : undefined,
      },
      include: {
        teeth: {
          orderBy: { toothNumber: 'asc' },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });

    return odontogram;
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.odontogram.findMany({
      where,
      include: {
        teeth: {
          orderBy: { toothNumber: 'asc' },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const odontogram = await this.prisma.odontogram.findFirst({
      where: { id, tenantId },
      include: {
        teeth: {
          orderBy: { toothNumber: 'asc' },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
            dateOfBirth: true,
          },
        },
      },
    });

    if (!odontogram) {
      throw new NotFoundException('Odontogram not found');
    }

    return odontogram;
  }

  async update(
    id: string,
    updateOdontogramDto: UpdateOdontogramDto,
    providerId: string,
    tenantId: string,
  ) {
    const odontogram = await this.prisma.odontogram.findFirst({
      where: { id, tenantId },
    });

    if (!odontogram) {
      throw new NotFoundException('Odontogram not found');
    }

    if (updateOdontogramDto.teeth) {
      await this.prisma.odontogramTooth.deleteMany({
        where: { odontogramId: id },
      });
    }

    return this.prisma.odontogram.update({
      where: { id },
      data: {
        notes: updateOdontogramDto.notes,
        teeth: updateOdontogramDto.teeth
          ? {
              create: updateOdontogramDto.teeth.map((tooth) => ({
                toothNumber: tooth.toothNumber,
                condition: tooth.condition,
                surfaces: tooth.surfaces || [],
                notes: tooth.notes,
                color: tooth.color,
              })),
            }
          : undefined,
      },
      include: {
        teeth: {
          orderBy: { toothNumber: 'asc' },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });
  }

  async remove(id: string, providerId: string, tenantId: string) {
    const odontogram = await this.prisma.odontogram.findFirst({
      where: { id, tenantId },
    });

    if (!odontogram) {
      throw new NotFoundException('Odontogram not found');
    }

    await this.prisma.odontogram.delete({ where: { id } });

    return { message: 'Odontogram deleted successfully' };
  }

  async getLatestByPatient(patientId: string, providerId: string, tenantId: string) {
    const odontogram = await this.prisma.odontogram.findFirst({
      where: { patientId, tenantId },
      include: {
        teeth: {
          orderBy: { toothNumber: 'asc' },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return odontogram;
  }

  // === Tooth-level CRUD ===

  async addTooth(odontogramId: string, toothDto: CreateToothDto, providerId: string, tenantId: string) {
    await this.findOne(odontogramId, providerId, tenantId);

    const existing = await this.prisma.odontogramTooth.findUnique({
      where: {
        odontogramId_toothNumber: {
          odontogramId,
          toothNumber: toothDto.toothNumber,
        },
      },
    });

    if (existing) {
      return this.prisma.odontogramTooth.update({
        where: { id: existing.id },
        data: {
          condition: toothDto.condition,
          surfaces: toothDto.surfaces || [],
          notes: toothDto.notes,
          color: toothDto.color,
        },
      });
    }

    return this.prisma.odontogramTooth.create({
      data: {
        odontogramId,
        toothNumber: toothDto.toothNumber,
        condition: toothDto.condition,
        surfaces: toothDto.surfaces || [],
        notes: toothDto.notes,
        color: toothDto.color,
      },
    });
  }

  async updateTooth(odontogramId: string, toothId: string, toothDto: Partial<CreateToothDto>, providerId: string, tenantId: string) {
    await this.findOne(odontogramId, providerId, tenantId);

    const tooth = await this.prisma.odontogramTooth.findFirst({
      where: { id: toothId, odontogramId },
    });

    if (!tooth) {
      throw new NotFoundException('Tooth not found');
    }

    return this.prisma.odontogramTooth.update({
      where: { id: toothId },
      data: {
        condition: toothDto.condition,
        surfaces: toothDto.surfaces,
        notes: toothDto.notes,
        color: toothDto.color,
      },
    });
  }

  async removeTooth(odontogramId: string, toothId: string, providerId: string, tenantId: string) {
    await this.findOne(odontogramId, providerId, tenantId);

    await this.prisma.odontogramTooth.delete({
      where: { id: toothId },
    });

    return { message: 'Tooth removed successfully' };
  }
}
