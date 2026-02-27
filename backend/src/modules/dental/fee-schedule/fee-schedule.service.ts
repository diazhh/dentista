import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  CreateFeeScheduleItemDto,
  UpdateFeeScheduleItemDto,
} from './dto/fee-schedule.dto';

@Injectable()
export class FeeScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateFeeScheduleDto) {
    return this.prisma.feeSchedule.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
        items: dto.items && dto.items.length > 0
          ? {
              create: dto.items.map((item) => ({
                cdtCode: item.cdtCode,
                procedureName: item.procedureName,
                category: item.category,
                description: item.description,
                fee: item.fee,
                insuranceFee: item.insuranceFee,
                patientCopay: item.patientCopay,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.feeSchedule.findMany({
      where: { tenantId },
      include: { items: { where: { isActive: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.feeSchedule.findFirst({
      where: { id, tenantId },
      include: { items: { orderBy: { cdtCode: 'asc' } } },
    });

    if (!item) {
      throw new NotFoundException('Fee schedule not found');
    }

    return item;
  }

  async update(id: string, tenantId: string, dto: UpdateFeeScheduleDto) {
    const item = await this.prisma.feeSchedule.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Fee schedule not found');
    }

    return this.prisma.feeSchedule.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
      include: { items: true },
    });
  }

  async delete(id: string, tenantId: string) {
    const item = await this.prisma.feeSchedule.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Fee schedule not found');
    }

    await this.prisma.feeSchedule.delete({ where: { id } });

    return { message: 'Fee schedule deleted successfully' };
  }

  async addItem(scheduleId: string, dto: CreateFeeScheduleItemDto) {
    return this.prisma.feeScheduleItem.create({
      data: {
        feeScheduleId: scheduleId,
        cdtCode: dto.cdtCode,
        procedureName: dto.procedureName,
        category: dto.category,
        description: dto.description,
        fee: dto.fee,
        insuranceFee: dto.insuranceFee,
        patientCopay: dto.patientCopay,
      },
    });
  }

  async updateItem(itemId: string, dto: UpdateFeeScheduleItemDto) {
    const item = await this.prisma.feeScheduleItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Fee schedule item not found');
    }

    return this.prisma.feeScheduleItem.update({
      where: { id: itemId },
      data: {
        cdtCode: dto.cdtCode,
        procedureName: dto.procedureName,
        category: dto.category,
        description: dto.description,
        fee: dto.fee,
        insuranceFee: dto.insuranceFee,
        patientCopay: dto.patientCopay,
        isActive: dto.isActive,
      },
    });
  }

  async deleteItem(itemId: string) {
    const item = await this.prisma.feeScheduleItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Fee schedule item not found');
    }

    await this.prisma.feeScheduleItem.delete({ where: { id: itemId } });

    return { message: 'Fee schedule item deleted successfully' };
  }

  async lookupFee(tenantId: string, cdtCode: string, scheduleId?: string) {
    const where: any = {
      cdtCode,
      isActive: true,
      feeSchedule: { tenantId, isActive: true },
    };

    if (scheduleId) {
      where.feeScheduleId = scheduleId;
    }

    const items = await this.prisma.feeScheduleItem.findMany({
      where,
      include: { feeSchedule: { select: { id: true, name: true, isDefault: true } } },
      orderBy: { feeSchedule: { isDefault: 'desc' } },
    });

    if (items.length === 0) {
      throw new NotFoundException(`No fee found for CDT code ${cdtCode}`);
    }

    return items;
  }
}
