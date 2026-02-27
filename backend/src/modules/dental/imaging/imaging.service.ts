import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDentalImageDto, UpdateDentalImageDto } from './dto/imaging.dto';

@Injectable()
export class ImagingService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateDentalImageDto) {
    return this.prisma.dentalImage.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        appointmentId: dto.appointmentId,
        imageType: dto.imageType,
        toothNumber: dto.toothNumber,
        region: dto.region,
        fileName: dto.fileName,
        filePath: dto.filePath,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType || 'image/jpeg',
        description: dto.description,
        findings: dto.findings,
        takenDate: dto.takenDate ? new Date(dto.takenDate) : new Date(),
      },
    });
  }

  async findAllByPatient(patientId: string, tenantId: string, imageType?: string) {
    const where: any = { patientId, tenantId };

    if (imageType) {
      where.imageType = imageType;
    }

    return this.prisma.dentalImage.findMany({
      where,
      orderBy: { takenDate: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.dentalImage.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Dental image not found');
    }

    return item;
  }

  async update(id: string, tenantId: string, dto: UpdateDentalImageDto) {
    const item = await this.prisma.dentalImage.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Dental image not found');
    }

    return this.prisma.dentalImage.update({
      where: { id },
      data: {
        appointmentId: dto.appointmentId,
        imageType: dto.imageType,
        toothNumber: dto.toothNumber,
        region: dto.region,
        fileName: dto.fileName,
        filePath: dto.filePath,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        description: dto.description,
        findings: dto.findings,
        takenDate: dto.takenDate ? new Date(dto.takenDate) : undefined,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const item = await this.prisma.dentalImage.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Dental image not found');
    }

    await this.prisma.dentalImage.delete({ where: { id } });

    return { message: 'Dental image deleted successfully' };
  }

  async findByAppointment(appointmentId: string, tenantId: string) {
    return this.prisma.dentalImage.findMany({
      where: { appointmentId, tenantId },
      orderBy: { takenDate: 'desc' },
    });
  }
}
