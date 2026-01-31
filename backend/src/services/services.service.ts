import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto, tenantId: string) {
    // Check if code already exists for this tenant
    const existing = await this.prisma.dentalService.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: createServiceDto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Service with code ${createServiceDto.code} already exists`);
    }

    return this.prisma.dentalService.create({
      data: {
        ...createServiceDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, category?: string, activeOnly: boolean = true) {
    const where: any = { tenantId };

    if (category) {
      where.category = category;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    return this.prisma.dentalService.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: string, tenantId: string) {
    const service = await this.prisma.dentalService.findFirst({
      where: { id, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findByCode(code: string, tenantId: string) {
    const service = await this.prisma.dentalService.findUnique({
      where: {
        tenantId_code: { tenantId, code },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with code ${code} not found`);
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, tenantId: string) {
    await this.findOne(id, tenantId);

    // If updating code, check for conflicts
    if (updateServiceDto.code) {
      const existing = await this.prisma.dentalService.findFirst({
        where: {
          tenantId,
          code: updateServiceDto.code,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Service with code ${updateServiceDto.code} already exists`);
      }
    }

    return this.prisma.dentalService.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    // Soft delete by setting isActive to false
    return this.prisma.dentalService.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCategories(tenantId: string) {
    const services = await this.prisma.dentalService.findMany({
      where: { tenantId, isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return services.map((s) => s.category);
  }

  async seedDefaultServices(tenantId: string) {
    const defaultServices = [
      // Preventive
      { code: 'D0120', name: 'Periodic Oral Evaluation', category: 'Preventive', defaultPrice: 75, duration: 15 },
      { code: 'D0150', name: 'Comprehensive Oral Evaluation', category: 'Preventive', defaultPrice: 95, duration: 30 },
      { code: 'D1110', name: 'Prophylaxis - Adult', category: 'Preventive', defaultPrice: 120, duration: 45 },
      { code: 'D1120', name: 'Prophylaxis - Child', category: 'Preventive', defaultPrice: 80, duration: 30 },
      { code: 'D0210', name: 'Intraoral X-Rays - Complete Series', category: 'Preventive', defaultPrice: 150, duration: 20 },
      { code: 'D0220', name: 'Periapical X-Ray - First Film', category: 'Preventive', defaultPrice: 35, duration: 5 },
      { code: 'D0274', name: 'Bitewing X-Rays - Four Films', category: 'Preventive', defaultPrice: 65, duration: 10 },
      { code: 'D1206', name: 'Topical Fluoride Varnish', category: 'Preventive', defaultPrice: 40, duration: 10 },

      // Restorative
      { code: 'D2140', name: 'Amalgam Filling - One Surface', category: 'Restorative', defaultPrice: 175, duration: 30 },
      { code: 'D2150', name: 'Amalgam Filling - Two Surfaces', category: 'Restorative', defaultPrice: 225, duration: 45 },
      { code: 'D2330', name: 'Resin Composite - One Surface, Anterior', category: 'Restorative', defaultPrice: 195, duration: 30 },
      { code: 'D2331', name: 'Resin Composite - Two Surfaces, Anterior', category: 'Restorative', defaultPrice: 250, duration: 45 },
      { code: 'D2391', name: 'Resin Composite - One Surface, Posterior', category: 'Restorative', defaultPrice: 215, duration: 30 },
      { code: 'D2392', name: 'Resin Composite - Two Surfaces, Posterior', category: 'Restorative', defaultPrice: 275, duration: 45 },

      // Crowns
      { code: 'D2740', name: 'Porcelain Crown', category: 'Crowns & Bridges', defaultPrice: 1200, duration: 90 },
      { code: 'D2750', name: 'Porcelain Fused to Metal Crown', category: 'Crowns & Bridges', defaultPrice: 1100, duration: 90 },
      { code: 'D2751', name: 'Porcelain Fused to Metal Crown - High Noble', category: 'Crowns & Bridges', defaultPrice: 1400, duration: 90 },

      // Endodontics
      { code: 'D3310', name: 'Root Canal - Anterior', category: 'Endodontics', defaultPrice: 850, duration: 60 },
      { code: 'D3320', name: 'Root Canal - Premolar', category: 'Endodontics', defaultPrice: 1000, duration: 75 },
      { code: 'D3330', name: 'Root Canal - Molar', category: 'Endodontics', defaultPrice: 1250, duration: 90 },

      // Extractions
      { code: 'D7140', name: 'Extraction - Erupted Tooth', category: 'Oral Surgery', defaultPrice: 200, duration: 30 },
      { code: 'D7210', name: 'Surgical Extraction', category: 'Oral Surgery', defaultPrice: 350, duration: 45 },
      { code: 'D7220', name: 'Impacted Tooth Removal - Soft Tissue', category: 'Oral Surgery', defaultPrice: 400, duration: 45 },
      { code: 'D7230', name: 'Impacted Tooth Removal - Partial Bony', category: 'Oral Surgery', defaultPrice: 500, duration: 60 },

      // Periodontics
      { code: 'D4341', name: 'Scaling and Root Planing - Per Quadrant', category: 'Periodontics', defaultPrice: 275, duration: 60 },
      { code: 'D4342', name: 'Scaling and Root Planing - 1-3 Teeth', category: 'Periodontics', defaultPrice: 175, duration: 30 },
      { code: 'D4910', name: 'Periodontal Maintenance', category: 'Periodontics', defaultPrice: 175, duration: 60 },

      // Dentures
      { code: 'D5110', name: 'Complete Upper Denture', category: 'Prosthodontics', defaultPrice: 1800, duration: 120 },
      { code: 'D5120', name: 'Complete Lower Denture', category: 'Prosthodontics', defaultPrice: 1800, duration: 120 },
      { code: 'D5213', name: 'Upper Partial Denture - Cast Metal', category: 'Prosthodontics', defaultPrice: 1600, duration: 90 },
    ];

    const results = [];
    for (const service of defaultServices) {
      try {
        const created = await this.prisma.dentalService.upsert({
          where: {
            tenantId_code: { tenantId, code: service.code },
          },
          update: {},
          create: {
            ...service,
            tenantId,
          },
        });
        results.push(created);
      } catch (error) {
        // Skip if exists
      }
    }

    return { created: results.length, services: results };
  }
}
