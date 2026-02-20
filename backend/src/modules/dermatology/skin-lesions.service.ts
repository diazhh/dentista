import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkinLesionDto, UpdateSkinLesionDto } from './dto/skin-lesions.dto';

@Injectable()
export class SkinLesionsService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, tenantId: string, dto: CreateSkinLesionDto) {
    return this.prisma.skinLesion.create({
      data: {
        patientId: dto.patientId,
        providerId,
        tenantId,
        bodyLocation: dto.bodyLocation,
        locationDetails: dto.locationDetails,
        lesionType: dto.lesionType,
        size: dto.size
          ? JSON.parse(JSON.stringify(dto.size))
          : undefined,
        color: dto.color,
        shape: dto.shape,
        borders: dto.borders,
        texture: dto.texture,
        symptoms: dto.symptoms,
        diagnosis: dto.diagnosis,
        differentialDiagnosis: dto.differentialDiagnosis,
        biopsyRequired: dto.biopsyRequired ?? false,
        biopsyDate: dto.biopsyDate,
        biopsyResult: dto.biopsyResult,
        images: dto.images
          ? JSON.parse(JSON.stringify(dto.images))
          : undefined,
        status: dto.status || 'ACTIVE',
        followUpDate: dto.followUpDate,
        notes: dto.notes,
      },
    });
  }

  async findAll(providerId: string, tenantId: string, patientId?: string) {
    const where: any = { tenantId, providerId };

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.skinLesion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.skinLesion.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Skin lesion not found');
    }

    return item;
  }

  async update(id: string, providerId: string, tenantId: string, dto: UpdateSkinLesionDto) {
    const item = await this.prisma.skinLesion.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Skin lesion not found');
    }

    return this.prisma.skinLesion.update({
      where: { id },
      data: {
        bodyLocation: dto.bodyLocation,
        locationDetails: dto.locationDetails,
        lesionType: dto.lesionType,
        size: dto.size
          ? JSON.parse(JSON.stringify(dto.size))
          : undefined,
        color: dto.color,
        shape: dto.shape,
        borders: dto.borders,
        texture: dto.texture,
        symptoms: dto.symptoms,
        diagnosis: dto.diagnosis,
        differentialDiagnosis: dto.differentialDiagnosis,
        biopsyRequired: dto.biopsyRequired,
        biopsyDate: dto.biopsyDate,
        biopsyResult: dto.biopsyResult,
        images: dto.images
          ? JSON.parse(JSON.stringify(dto.images))
          : undefined,
        status: dto.status,
        followUpDate: dto.followUpDate,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, providerId: string, tenantId: string) {
    const item = await this.prisma.skinLesion.findFirst({
      where: { id, providerId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Skin lesion not found');
    }

    await this.prisma.skinLesion.delete({ where: { id } });

    return { message: 'Skin lesion deleted successfully' };
  }
}
