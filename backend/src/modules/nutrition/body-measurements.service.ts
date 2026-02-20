import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBodyMeasurementDto, UpdateBodyMeasurementDto } from './dto/body-measurements.dto';

@Injectable()
export class BodyMeasurementsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateBodyMeasurementDto) {
    return this.prisma.bodyMeasurement.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        measurementDate: dto.measurementDate,
        weight: dto.weight,
        height: dto.height,
        bmi: dto.bmi,
        bodyFatPercentage: dto.bodyFatPercentage,
        muscleMass: dto.muscleMass,
        waistCircumference: dto.waistCircumference,
        hipCircumference: dto.hipCircumference,
        chestCircumference: dto.chestCircumference,
        armCircumference: dto.armCircumference,
        thighCircumference: dto.thighCircumference,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.bodyMeasurement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const measurement = await this.prisma.bodyMeasurement.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!measurement) {
      throw new NotFoundException('Body measurement not found');
    }

    return measurement;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateBodyMeasurementDto) {
    const measurement = await this.prisma.bodyMeasurement.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!measurement) {
      throw new NotFoundException('Body measurement not found');
    }

    return this.prisma.bodyMeasurement.update({
      where: { id },
      data: {
        measurementDate: dto.measurementDate,
        weight: dto.weight,
        height: dto.height,
        bmi: dto.bmi,
        bodyFatPercentage: dto.bodyFatPercentage,
        muscleMass: dto.muscleMass,
        waistCircumference: dto.waistCircumference,
        hipCircumference: dto.hipCircumference,
        chestCircumference: dto.chestCircumference,
        armCircumference: dto.armCircumference,
        thighCircumference: dto.thighCircumference,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const measurement = await this.prisma.bodyMeasurement.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!measurement) {
      throw new NotFoundException('Body measurement not found');
    }

    await this.prisma.bodyMeasurement.delete({ where: { id } });

    return { message: 'Body measurement deleted successfully' };
  }
}
