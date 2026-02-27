import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOdontogramDto, CreateToothDto } from './dto/create-odontogram.dto';
import { UpdateOdontogramDto } from './dto/update-odontogram.dto';
import { ToothCondition, ToothSurface } from '@prisma/client';

@Injectable()
export class OdontogramsService {
  constructor(private prisma: PrismaService) {}

  // ─── Get or create the single odontogram for a patient ────────────────────
  async getOrCreateForPatient(patientId: string, providerId: string, tenantId: string) {
    let odontogram = await this.prisma.odontogram.findFirst({
      where: { patientId, tenantId },
      include: {
        teeth: { orderBy: { toothNumber: 'asc' }, include: { history: { orderBy: { changedAt: 'desc' }, take: 5 } } },
        patient: { select: { firstName: true, lastName: true, documentId: true, dateOfBirth: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return odontogram; // null means "no odontogram yet"
  }

  // ─── Create initial odontogram (1 per patient) ───────────────────────────
  async create(createOdontogramDto: CreateOdontogramDto, providerId: string, tenantId: string) {
    // Check if patient already has an odontogram
    const existing = await this.prisma.odontogram.findFirst({
      where: { patientId: createOdontogramDto.patientId, tenantId },
    });

    if (existing) {
      // Return the existing one instead of creating duplicate
      return this.findOne(existing.id, providerId, tenantId);
    }

    const odontogram = await this.prisma.odontogram.create({
      data: {
        patientId: createOdontogramDto.patientId,
        providerId,
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
        teeth: { orderBy: { toothNumber: 'asc' } },
        patient: { select: { firstName: true, lastName: true, documentId: true, dateOfBirth: true } },
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
        teeth: { orderBy: { toothNumber: 'asc' } },
        patient: { select: { firstName: true, lastName: true, documentId: true } },
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
          include: { history: { orderBy: { changedAt: 'desc' }, take: 10 } },
        },
        patient: { select: { firstName: true, lastName: true, documentId: true, dateOfBirth: true } },
      },
    });

    if (!odontogram) {
      throw new NotFoundException('Odontogram not found');
    }

    return odontogram;
  }

  async update(id: string, updateOdontogramDto: UpdateOdontogramDto, providerId: string, tenantId: string) {
    const odontogram = await this.prisma.odontogram.findFirst({
      where: { id, tenantId },
    });

    if (!odontogram) {
      throw new NotFoundException('Odontogram not found');
    }

    // Only update notes, NOT teeth (teeth are updated individually)
    return this.prisma.odontogram.update({
      where: { id },
      data: { notes: updateOdontogramDto.notes },
      include: {
        teeth: { orderBy: { toothNumber: 'asc' } },
        patient: { select: { firstName: true, lastName: true, documentId: true } },
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
    return this.prisma.odontogram.findFirst({
      where: { patientId, tenantId },
      include: {
        teeth: {
          orderBy: { toothNumber: 'asc' },
          include: { history: { orderBy: { changedAt: 'desc' }, take: 5 } },
        },
        patient: { select: { firstName: true, lastName: true, documentId: true, dateOfBirth: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // ─── Tooth-level CRUD with history tracking ─────────────────────────────

  async addTooth(odontogramId: string, toothDto: CreateToothDto, providerId: string, tenantId: string) {
    await this.findOne(odontogramId, providerId, tenantId);

    const existing = await this.prisma.odontogramTooth.findUnique({
      where: { odontogramId_toothNumber: { odontogramId, toothNumber: toothDto.toothNumber } },
    });

    if (existing) {
      return this.updateToothWithHistory(odontogramId, existing.id, toothDto, providerId, tenantId);
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
    return this.updateToothWithHistory(odontogramId, toothId, toothDto, providerId, tenantId);
  }

  private async updateToothWithHistory(
    odontogramId: string,
    toothId: string,
    toothDto: Partial<CreateToothDto>,
    providerId: string,
    tenantId: string,
    appointmentId?: string,
  ) {
    await this.findOne(odontogramId, providerId, tenantId);

    const tooth = await this.prisma.odontogramTooth.findFirst({
      where: { id: toothId, odontogramId },
    });

    if (!tooth) {
      throw new NotFoundException('Tooth not found');
    }

    // Record history if condition changed
    if (toothDto.condition && toothDto.condition !== tooth.condition) {
      await this.prisma.toothHistory.create({
        data: {
          toothId: tooth.id,
          previousCondition: tooth.condition,
          newCondition: toothDto.condition as ToothCondition,
          surfaces: toothDto.surfaces || tooth.surfaces,
          notes: toothDto.notes || null,
          appointmentId: appointmentId || null,
        },
      });
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
    await this.prisma.odontogramTooth.delete({ where: { id: toothId } });
    return { message: 'Tooth removed successfully' };
  }

  // ─── Update from procedure (appointment integration) ────────────────────

  async updateFromProcedure(
    patientId: string,
    data: { toothNumber: number; newCondition: ToothCondition; surfaces?: ToothSurface[]; appointmentId?: string; notes?: string },
    providerId: string,
    tenantId: string,
  ) {
    // Get or create odontogram for the patient
    let odontogram = await this.prisma.odontogram.findFirst({
      where: { patientId, tenantId },
      include: { teeth: true },
    });

    if (!odontogram) {
      odontogram = await this.prisma.odontogram.create({
        data: { patientId, providerId, tenantId },
        include: { teeth: true },
      });
    }

    const existingTooth = odontogram.teeth.find((t) => t.toothNumber === data.toothNumber);

    if (existingTooth) {
      // Record history
      if (existingTooth.condition !== data.newCondition) {
        await this.prisma.toothHistory.create({
          data: {
            toothId: existingTooth.id,
            previousCondition: existingTooth.condition,
            newCondition: data.newCondition,
            surfaces: data.surfaces || [],
            notes: data.notes || null,
            appointmentId: data.appointmentId || null,
          },
        });
      }

      // Update tooth
      return this.prisma.odontogramTooth.update({
        where: { id: existingTooth.id },
        data: {
          condition: data.newCondition,
          surfaces: data.surfaces || existingTooth.surfaces,
          notes: data.notes || existingTooth.notes,
        },
      });
    } else {
      // Create new tooth entry
      const newTooth = await this.prisma.odontogramTooth.create({
        data: {
          odontogramId: odontogram.id,
          toothNumber: data.toothNumber,
          condition: data.newCondition,
          surfaces: data.surfaces || [],
          notes: data.notes,
        },
      });

      // Record initial history
      await this.prisma.toothHistory.create({
        data: {
          toothId: newTooth.id,
          previousCondition: ToothCondition.HEALTHY,
          newCondition: data.newCondition,
          surfaces: data.surfaces || [],
          notes: data.notes || null,
          appointmentId: data.appointmentId || null,
        },
      });

      return newTooth;
    }
  }

  // ─── Get history for a specific tooth ───────────────────────────────────

  async getToothHistory(odontogramId: string, toothId: string, providerId: string, tenantId: string) {
    await this.findOne(odontogramId, providerId, tenantId);

    return this.prisma.toothHistory.findMany({
      where: { toothId },
      include: {
        appointment: { select: { id: true, appointmentDate: true, procedureType: true } },
      },
      orderBy: { changedAt: 'desc' },
    });
  }

  // ─── Get all history for an odontogram ──────────────────────────────────

  async getOdontogramHistory(odontogramId: string, providerId: string, tenantId: string) {
    await this.findOne(odontogramId, providerId, tenantId);

    return this.prisma.toothHistory.findMany({
      where: { tooth: { odontogramId } },
      include: {
        tooth: { select: { toothNumber: true } },
        appointment: { select: { id: true, appointmentDate: true, procedureType: true } },
      },
      orderBy: { changedAt: 'desc' },
    });
  }
}
