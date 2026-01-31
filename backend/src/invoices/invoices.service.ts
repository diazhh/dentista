import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    // Usar transacción para evitar race conditions
    const result = await this.prisma.$transaction(async (tx) => {
      const lastInvoice = await tx.invoice.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
      });

      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      return `INV-${nextNumber.toString().padStart(6, '0')}`;
    });

    return result;
  }

  async create(dto: CreateInvoiceDto, dentistId: string, tenantId: string) {
    const relation = await this.prisma.patientDentistRelation.findFirst({
      where: {
        patientId: dto.patientId,
        dentistId,
        isActive: true,
      },
    });

    if (!relation) {
      throw new ForbiddenException('Patient is not associated with this dentist');
    }

    const subtotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = dto.tax || 0;
    const discount = dto.discount || 0;
    const total = subtotal + tax - discount;

    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: dto.patientId,
        dentistId,
        tenantId,
        treatmentPlanId: dto.treatmentPlanId,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        subtotal,
        tax,
        discount,
        total,
        balance: total,
        notes: dto.notes,
        terms: dto.terms,
        items: {
          create: dto.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });
  }

  async findAll(dentistId: string, tenantId: string, patientId?: string, status?: string) {
    const where: any = {
      dentistId,
      tenantId,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
        payments: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  async findOne(id: string, dentistId: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        dentistId,
        tenantId,
      },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
            phone: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    let updateData: any = {
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      notes: dto.notes,
      terms: dto.terms,
    };

    if (dto.items) {
      const subtotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = dto.tax || 0;
      const discount = dto.discount || 0;
      const total = subtotal + tax - discount;

      updateData = {
        ...updateData,
        subtotal,
        tax,
        discount,
        total,
        balance: total,
      };
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    return this.prisma.invoice.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
    });
  }

  async remove(id: string, dentistId: string, tenantId: string) {
    await this.findOne(id, dentistId, tenantId);

    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  async getStats(dentistId: string, tenantId: string, startDate?: string, endDate?: string) {
    const where: any = {
      dentistId,
      tenantId,
    };

    // Filtrar por fecha si se proporcionan
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate);
      }
    }

    // Obtener todas las facturas para calcular estadísticas
    const invoices = await this.prisma.invoice.findMany({
      where,
      select: {
        total: true,
        balance: true,
        status: true,
        issueDate: true,
        dueDate: true,
      },
    });

    const now = new Date();

    // Calcular estadísticas
    // Estados válidos: DRAFT, SENT, PAID, OVERDUE, CANCELLED
    const stats = invoices.reduce((acc, invoice) => {
      acc.totalInvoiced += invoice.total;
      acc.totalPaid += (invoice.total - invoice.balance);
      acc.totalPending += invoice.balance;

      if (invoice.status === 'PAID') {
        acc.paidCount++;
      } else if (invoice.status === 'SENT' || invoice.status === 'DRAFT') {
        acc.pendingCount++;
        // Verificar si está vencida
        if (invoice.dueDate && invoice.dueDate < now) {
          acc.overdueCount++;
          acc.totalOverdue += invoice.balance;
        }
      } else if (invoice.status === 'OVERDUE') {
        acc.overdueCount++;
        acc.totalOverdue += invoice.balance;
      } else if (invoice.status === 'CANCELLED') {
        acc.cancelledCount++;
      }

      return acc;
    }, {
      totalInvoiced: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      invoiceCount: invoices.length,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      cancelledCount: 0,
    });

    // Calcular estadísticas mensuales (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyInvoices = await this.prisma.invoice.findMany({
      where: {
        dentistId,
        tenantId,
        issueDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        total: true,
        balance: true,
        issueDate: true,
      },
    });

    const monthlyStats = monthlyInvoices.reduce((acc, invoice) => {
      const monthKey = `${invoice.issueDate.getFullYear()}-${String(invoice.issueDate.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { invoiced: 0, paid: 0, count: 0 };
      }
      acc[monthKey].invoiced += invoice.total;
      acc[monthKey].paid += (invoice.total - invoice.balance);
      acc[monthKey].count++;
      return acc;
    }, {} as Record<string, { invoiced: number; paid: number; count: number }>);

    return {
      ...stats,
      monthlyStats,
    };
  }
}
