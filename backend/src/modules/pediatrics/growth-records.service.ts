import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './dto/growth-records.dto';

@Injectable()
export class GrowthRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateGrowthRecordDto) {
    return this.prisma.growthRecord.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        measurementDate: dto.measurementDate,
        ageMonths: dto.ageMonths,
        weight: dto.weight,
        height: dto.height,
        headCircumference: dto.headCircumference,
        bmi: dto.bmi,
        weightPercentile: dto.weightPercentile,
        heightPercentile: dto.heightPercentile,
        headPercentile: dto.headPercentile,
        bmiPercentile: dto.bmiPercentile,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.growthRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const record = await this.prisma.growthRecord.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Growth record not found');
    }

    return record;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateGrowthRecordDto) {
    const record = await this.prisma.growthRecord.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Growth record not found');
    }

    return this.prisma.growthRecord.update({
      where: { id },
      data: {
        measurementDate: dto.measurementDate,
        ageMonths: dto.ageMonths,
        weight: dto.weight,
        height: dto.height,
        headCircumference: dto.headCircumference,
        bmi: dto.bmi,
        weightPercentile: dto.weightPercentile,
        heightPercentile: dto.heightPercentile,
        headPercentile: dto.headPercentile,
        bmiPercentile: dto.bmiPercentile,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const record = await this.prisma.growthRecord.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Growth record not found');
    }

    await this.prisma.growthRecord.delete({ where: { id } });

    return { message: 'Growth record deleted successfully' };
  }
}
