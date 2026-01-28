import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, tenantId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.tenantId !== tenantId) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add payment to cancelled invoice');
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = invoice.total - totalPaid;

    if (dto.amount > remainingBalance) {
      throw new BadRequestException(`Payment amount exceeds remaining balance of ${remainingBalance}`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        patientId: invoice.patientId,
        tenantId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paymentDate: new Date(dto.paymentDate),
        transactionId: dto.transactionId,
        reference: dto.reference,
        notes: dto.notes,
        status: 'COMPLETED',
      },
    });

    const newTotalPaid = totalPaid + dto.amount;
    const newBalance = invoice.total - newTotalPaid;

    await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        amountPaid: newTotalPaid,
        balance: newBalance,
        status: newBalance === 0 ? 'PAID' : invoice.status,
      },
    });

    return payment;
  }

  async findAll(tenantId: string, invoiceId?: string, patientId?: string) {
    const where: any = { tenantId };

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            amountPaid: true,
            balance: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentId: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async remove(id: string, tenantId: string) {
    const payment = await this.findOne(id, tenantId);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id },
      });

      const invoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId },
        include: { payments: true },
      });

      const totalPaid = invoice.payments
        .filter(p => p.id !== id)
        .reduce((sum, p) => sum + p.amount, 0);
      const newBalance = invoice.total - totalPaid;

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          amountPaid: totalPaid,
          balance: newBalance,
          status: newBalance > 0 ? 'SENT' : 'PAID',
        },
      });
    });

    return { message: 'Payment deleted successfully' };
  }
}
