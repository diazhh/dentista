import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClinicalNoteDto, UpdateClinicalNoteDto } from './dto/clinical-notes.dto';

@Injectable()
export class ClinicalNotesService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateClinicalNoteDto) {
    return this.prisma.clinicalNote.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        appointmentId: dto.appointmentId,
        noteType: dto.noteType || 'SOAP',
        subjective: dto.subjective,
        objective: dto.objective,
        assessment: dto.assessment,
        plan: dto.plan,
        vitalSigns: dto.vitalSigns
          ? JSON.parse(JSON.stringify(dto.vitalSigns))
          : undefined,
        diagnoses: dto.diagnoses
          ? JSON.parse(JSON.stringify(dto.diagnoses))
          : undefined,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.clinicalNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const note = await this.prisma.clinicalNote.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!note) {
      throw new NotFoundException('Clinical note not found');
    }

    return note;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateClinicalNoteDto) {
    const note = await this.prisma.clinicalNote.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!note) {
      throw new NotFoundException('Clinical note not found');
    }

    return this.prisma.clinicalNote.update({
      where: { id },
      data: {
        noteType: dto.noteType,
        subjective: dto.subjective,
        objective: dto.objective,
        assessment: dto.assessment,
        plan: dto.plan,
        vitalSigns: dto.vitalSigns
          ? JSON.parse(JSON.stringify(dto.vitalSigns))
          : undefined,
        diagnoses: dto.diagnoses
          ? JSON.parse(JSON.stringify(dto.diagnoses))
          : undefined,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const note = await this.prisma.clinicalNote.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!note) {
      throw new NotFoundException('Clinical note not found');
    }

    await this.prisma.clinicalNote.delete({ where: { id } });

    return { message: 'Clinical note deleted successfully' };
  }
}
