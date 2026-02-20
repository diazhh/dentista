import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVaccinationRecordDto, UpdateVaccinationRecordDto } from './dto/vaccination-records.dto';

@Injectable()
export class VaccinationRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateVaccinationRecordDto) {
    return this.prisma.vaccinationRecord.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        vaccineName: dto.vaccineName,
        vaccineType: dto.vaccineType,
        doseNumber: dto.doseNumber,
        administeredDate: dto.administeredDate,
        nextDoseDate: dto.nextDoseDate,
        batchNumber: dto.batchNumber,
        site: dto.site,
        route: dto.route,
        manufacturer: dto.manufacturer,
        adverseReaction: dto.adverseReaction,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.vaccinationRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const record = await this.prisma.vaccinationRecord.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Vaccination record not found');
    }

    return record;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateVaccinationRecordDto) {
    const record = await this.prisma.vaccinationRecord.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Vaccination record not found');
    }

    return this.prisma.vaccinationRecord.update({
      where: { id },
      data: {
        vaccineName: dto.vaccineName,
        vaccineType: dto.vaccineType,
        doseNumber: dto.doseNumber,
        administeredDate: dto.administeredDate,
        nextDoseDate: dto.nextDoseDate,
        batchNumber: dto.batchNumber,
        site: dto.site,
        route: dto.route,
        manufacturer: dto.manufacturer,
        adverseReaction: dto.adverseReaction,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const record = await this.prisma.vaccinationRecord.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Vaccination record not found');
    }

    await this.prisma.vaccinationRecord.delete({ where: { id } });

    return { message: 'Vaccination record deleted successfully' };
  }
}
