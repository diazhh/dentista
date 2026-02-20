import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, CreateMovementDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { category?: string; search?: string; lowStock?: boolean }) {
    const where: any = { tenantId, isActive: true };

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { supplier: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (params?.lowStock) {
      return items.filter(item => item.currentStock <= item.minimumStock);
    }

    return items;
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!item) throw new NotFoundException('Item no encontrado');
    return item;
  }

  async create(tenantId: string, dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({
      data: {
        tenantId,
        name: dto.name,
        sku: dto.sku,
        category: dto.category,
        description: dto.description,
        unit: dto.unit || 'unidad',
        currentStock: dto.currentStock || 0,
        minimumStock: dto.minimumStock || 0,
        maximumStock: dto.maximumStock,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        supplier: dto.supplier,
        location: dto.location,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Item no encontrado');

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...dto,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Item no encontrado');

    return this.prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createMovement(tenantId: string, userId: string, dto: CreateMovementDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: dto.itemId, tenantId },
    });

    if (!item) throw new NotFoundException('Item no encontrado');

    const previousStock = item.currentStock;
    let newStock: number;

    switch (dto.type) {
      case 'IN':
      case 'RETURN':
        newStock = previousStock + dto.quantity;
        break;
      case 'OUT':
      case 'EXPIRED':
        if (previousStock < dto.quantity) {
          throw new BadRequestException(`Stock insuficiente. Disponible: ${previousStock}`);
        }
        newStock = previousStock - dto.quantity;
        break;
      case 'ADJUSTMENT':
        newStock = dto.quantity; // absolute value
        break;
      default:
        throw new BadRequestException(`Tipo de movimiento inválido: ${dto.type}`);
    }

    const [movement] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.create({
        data: {
          itemId: dto.itemId,
          tenantId,
          userId,
          type: dto.type,
          quantity: dto.quantity,
          reason: dto.reason,
          reference: dto.reference,
          previousStock,
          newStock,
        },
      }),
      this.prisma.inventoryItem.update({
        where: { id: dto.itemId },
        data: { currentStock: newStock },
      }),
    ]);

    return movement;
  }

  async getMovements(itemId: string, tenantId: string) {
    return this.prisma.inventoryMovement.findMany({
      where: { itemId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(tenantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId, isActive: true },
    });

    const totalItems = items.length;
    const lowStockItems = items.filter(i => i.currentStock <= i.minimumStock).length;
    const totalValue = items.reduce((sum, i) => sum + (i.costPrice || 0) * i.currentStock, 0);
    const expiringSoon = items.filter(i => {
      if (!i.expirationDate) return false;
      const daysUntilExpiry = (i.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;

    const byCategory = items.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalItems, lowStockItems, totalValue, expiringSoon, byCategory };
  }
}
