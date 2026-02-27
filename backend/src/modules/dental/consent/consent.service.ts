import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProcedureConsentDto, SignConsentDto } from './dto/consent.dto';

@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateProcedureConsentDto) {
    return this.prisma.procedureConsent.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        appointmentId: dto.appointmentId,
        procedureType: dto.procedureType,
        toothNumbers: dto.toothNumbers,
        consentText: dto.consentText,
        risks: dto.risks,
        alternatives: dto.alternatives,
      },
    });
  }

  async findAllByPatient(patientId: string, tenantId: string) {
    return this.prisma.procedureConsent.findMany({
      where: { patientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.procedureConsent.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Procedure consent not found');
    }

    return item;
  }

  async sign(id: string, tenantId: string, dto: SignConsentDto) {
    const item = await this.prisma.procedureConsent.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Procedure consent not found');
    }

    return this.prisma.procedureConsent.update({
      where: { id },
      data: {
        patientSignature: dto.patientSignature,
        signedAt: new Date(),
        witnessName: dto.witnessName,
        witnessSignature: dto.witnessSignature,
        status: 'SIGNED',
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const item = await this.prisma.procedureConsent.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Procedure consent not found');
    }

    await this.prisma.procedureConsent.delete({ where: { id } });

    return { message: 'Procedure consent deleted successfully' };
  }
}
