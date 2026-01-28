import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOdontogramDto } from './dto/create-odontogram.dto';
import { UpdateOdontogramDto } from './dto/update-odontogram.dto';

@Injectable()
export class OdontogramsService {
  constructor(private prisma: PrismaService) {}

  async create(createOdontogramDto: CreateOdontogramDto, dentistId: string, tenantId: string) {
    const relation = await this.prisma.patientDentistRelation.findFirst({
      where: {
        patientId: createOdontogramDto.patientId,
        dentistId,
        tenantId,
      },
    });

    if (!relation) {
      throw new ForbiddenException('Patient not assigned to this dentist');
    }

    const odontogram = await this.prisma.odontogram.create({
      data: {
        patientId: createOdontogramDto.patientId,
        dentistId,
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

  async findAll(dentistId: string, tenantId: string, patientId?: string) {
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

  async findOne(id: string, dentistId: string, tenantId: string) {
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
    dentistId: string,
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

  async remove(id: string, dentistId: string, tenantId: string) {
    const odontogram = await this.prisma.odontogram.findFirst({
      where: { id, tenantId },
    });

    if (!odontogram) {
      throw new NotFoundException('Odontogram not found');
    }

    await this.prisma.odontogram.delete({ where: { id } });

    return { message: 'Odontogram deleted successfully' };
  }

  async getLatestByPatient(patientId: string, dentistId: string, tenantId: string) {
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
}
