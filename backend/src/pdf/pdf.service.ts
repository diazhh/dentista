import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';

@Injectable()
export class PdfService implements OnModuleInit {
  private readonly logger = new Logger(PdfService.name);
  private printer: any;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      // Dynamic import for pdfmake to handle ESM compatibility
      const PdfMake = await import('pdfmake/build/pdfmake');
      const pdfFonts = await import('pdfmake/build/vfs_fonts');

      // For server-side usage
      const fonts = {
        Roboto: {
          normal: path.join(process.cwd(), 'node_modules/pdfmake/build/vfs_fonts.js'),
          bold: path.join(process.cwd(), 'node_modules/pdfmake/build/vfs_fonts.js'),
          italics: path.join(process.cwd(), 'node_modules/pdfmake/build/vfs_fonts.js'),
          bolditalics: path.join(process.cwd(), 'node_modules/pdfmake/build/vfs_fonts.js'),
        },
      };

      // Use the createPdf function directly with vfs
      this.printer = {
        createPdfKitDocument: (docDefinition: any) => {
          // Create PDF using pdfmake
          const PdfPrinter = require('pdfmake');
          const printer = new PdfPrinter(fonts);
          return printer.createPdfKitDocument(docDefinition);
        }
      };
      this.logger.log('PDF service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PDF service', error);
      // Create a fallback printer that throws helpful errors
      this.printer = {
        createPdfKitDocument: () => {
          throw new Error('PDF service not properly initialized');
        }
      };
    }
  }

  /**
   * Generates a PDF for an invoice
   */
  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: {
          include: { user: true },
        },
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get tenant info for clinic details
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: invoice.tenantId },
      include: { owner: true },
    });

    const docDefinition: any = {
      content: [
        // Header
        {
          columns: [
            {
              text: tenant?.name || 'MediCloud',
              style: 'header',
              width: '*',
            },
            {
              text: [
                { text: 'FACTURA\n', style: 'invoiceTitle' },
                { text: `#${invoice.invoiceNumber}`, style: 'invoiceNumber' },
              ],
              alignment: 'right' as const,
              width: 'auto',
            },
          ],
        },
        { text: '', margin: [0, 20] as [number, number] },

        // Invoice dates
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Facturar a:', style: 'sectionHeader' },
                { text: `${invoice.patient.firstName} ${invoice.patient.lastName}` },
                { text: invoice.patient.user?.email || '' },
                { text: invoice.patient.phone || '' },
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: `Fecha de emisión: ${this.formatDate(invoice.issueDate)}`, alignment: 'right' as const },
                { text: `Fecha de vencimiento: ${this.formatDate(invoice.dueDate)}`, alignment: 'right' as const },
                {
                  text: `Estado: ${this.translateStatus(invoice.status)}`,
                  alignment: 'right' as const,
                  color: this.getStatusColor(invoice.status),
                  bold: true,
                },
              ],
            },
          ],
        },
        { text: '', margin: [0, 20] as [number, number] },

        // Items table
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Cantidad', style: 'tableHeader', alignment: 'center' as const },
                { text: 'Precio Unit.', style: 'tableHeader', alignment: 'right' as const },
                { text: 'Total', style: 'tableHeader', alignment: 'right' as const },
              ],
              ...invoice.items.map((item) => [
                item.description,
                { text: item.quantity.toString(), alignment: 'center' as const },
                { text: this.formatCurrency(item.unitPrice), alignment: 'right' as const },
                { text: this.formatCurrency(item.total), alignment: 'right' as const },
              ]),
            ],
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0),
            vLineWidth: () => 0,
            hLineColor: () => '#E5E7EB',
            paddingTop: () => 8,
            paddingBottom: () => 8,
          },
        },
        { text: '', margin: [0, 20] as [number, number] },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                body: [
                  [{ text: 'Subtotal:', alignment: 'right' as const }, { text: this.formatCurrency(invoice.subtotal), alignment: 'right' as const }],
                  [{ text: 'Impuestos:', alignment: 'right' as const }, { text: this.formatCurrency(invoice.tax), alignment: 'right' as const }],
                  ...(invoice.discount > 0
                    ? [[{ text: 'Descuento:', alignment: 'right' as const }, { text: `-${this.formatCurrency(invoice.discount)}`, alignment: 'right' as const }]]
                    : []),
                  [
                    { text: 'Total:', alignment: 'right' as const, bold: true },
                    { text: this.formatCurrency(invoice.total), alignment: 'right' as const, bold: true },
                  ],
                  [
                    { text: 'Pagado:', alignment: 'right' as const },
                    { text: this.formatCurrency(invoice.amountPaid), alignment: 'right' as const, color: '#10B981' },
                  ],
                  [
                    { text: 'Balance:', alignment: 'right' as const, bold: true },
                    {
                      text: this.formatCurrency(invoice.balance),
                      alignment: 'right' as const,
                      bold: true,
                      color: invoice.balance > 0 ? '#EF4444' : '#10B981',
                    },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },

        // Payments history
        ...(invoice.payments.length > 0
          ? [
              { text: '', margin: [0, 20] as [number, number] },
              { text: 'Historial de pagos', style: 'sectionHeader' },
              {
                table: {
                  headerRows: 1,
                  widths: ['auto', '*', 'auto'],
                  body: [
                    [
                      { text: 'Fecha', style: 'tableHeader' },
                      { text: 'Método', style: 'tableHeader' },
                      { text: 'Monto', style: 'tableHeader', alignment: 'right' as const },
                    ],
                    ...invoice.payments.map((payment) => [
                      this.formatDate(payment.paymentDate),
                      this.translatePaymentMethod(payment.paymentMethod),
                      { text: this.formatCurrency(payment.amount), alignment: 'right' as const },
                    ]),
                  ],
                },
                layout: 'lightHorizontalLines',
              },
            ]
          : []),

        // Notes
        ...(invoice.notes
          ? [{ text: '', margin: [0, 20] as [number, number] }, { text: 'Notas:', style: 'sectionHeader' }, { text: invoice.notes }]
          : []),

        // Terms
        ...(invoice.terms
          ? [{ text: '', margin: [0, 10] as [number, number] }, { text: 'Términos:', style: 'sectionHeader' }, { text: invoice.terms, fontSize: 9, color: '#6B7280' }]
          : []),
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          color: '#1F2937',
        },
        invoiceTitle: {
          fontSize: 14,
          color: '#6B7280',
        },
        invoiceNumber: {
          fontSize: 18,
          bold: true,
          color: '#1F2937',
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: '#374151',
          margin: [0, 0, 0, 8],
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: '#374151',
          fillColor: '#F9FAFB',
        },
      },
      defaultStyle: {
        fontSize: 10,
        color: '#4B5563',
      },
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage} de ${pageCount} | Generado por MediCloud`,
        alignment: 'center' as const,
        fontSize: 8,
        color: '#9CA3AF',
        margin: [0, 20],
      }),
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);

      pdfDoc.end();
    });
  }

  /**
   * Generates a PDF for a prescription
   */
  async generatePrescriptionPdf(prescriptionId: string): Promise<Buffer> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: prescription.patientId },
    });

    const provider = await this.prisma.user.findUnique({
      where: { id: prescription.providerId },
    });

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: prescription.tenantId },
    });

    const medications = (prescription.medications as any[]) || [];

    const docDefinition: any = {
      content: [
        {
          columns: [
            { text: tenant?.name || 'MediCloud', style: 'header', width: '*' },
            { text: 'RECETA MÉDICA', style: 'invoiceTitle', alignment: 'right' as const, width: 'auto' },
          ],
        },
        { text: '', margin: [0, 5] as [number, number] },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: `Dr(a). ${provider?.name || 'N/A'}`, bold: true },
                { text: provider?.licenseNumber ? `Lic. ${provider.licenseNumber}` : '' },
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: `Fecha: ${this.formatDate(prescription.issuedAt)}`, alignment: 'right' as const },
                ...(prescription.expiresAt
                  ? [{ text: `Vence: ${this.formatDate(prescription.expiresAt)}`, alignment: 'right' as const }]
                  : []),
              ],
            },
          ],
        },
        { text: '', margin: [0, 15] as [number, number] },
        {
          table: {
            widths: ['*'],
            body: [[{
              stack: [
                { text: 'Paciente:', bold: true, fontSize: 9, color: '#6B7280' },
                { text: `${patient?.firstName || ''} ${patient?.lastName || ''}`, fontSize: 12 },
                { text: patient?.documentId ? `Doc: ${patient.documentId}` : '', fontSize: 9 },
              ],
              margin: [8, 8] as [number, number],
            }]],
          },
          layout: { hLineColor: () => '#E5E7EB', vLineColor: () => '#E5E7EB' },
        },
        { text: '', margin: [0, 15] as [number, number] },
        { text: 'Rx', style: 'rxSymbol' },
        { text: '', margin: [0, 10] as [number, number] },
        ...medications.map((med: any, idx: number) => ({
          stack: [
            { text: `${idx + 1}. ${med.name || med.medication || 'Medicamento'}`, bold: true, fontSize: 11 },
            ...(med.dosage ? [{ text: `   Dosis: ${med.dosage}`, fontSize: 10 }] : []),
            ...(med.frequency ? [{ text: `   Frecuencia: ${med.frequency}`, fontSize: 10 }] : []),
            ...(med.duration ? [{ text: `   Duración: ${med.duration}`, fontSize: 10 }] : []),
            ...(med.instructions ? [{ text: `   Indicaciones: ${med.instructions}`, fontSize: 9, color: '#6B7280' }] : []),
            { text: '', margin: [0, 6] as [number, number] },
          ],
        })),
        ...(prescription.diagnosis
          ? [{ text: '', margin: [0, 10] as [number, number] }, { text: 'Diagnóstico:', bold: true }, { text: prescription.diagnosis }]
          : []),
        ...(prescription.notes
          ? [{ text: '', margin: [0, 8] as [number, number] }, { text: 'Notas:', bold: true }, { text: prescription.notes }]
          : []),
        { text: '', margin: [0, 40] as [number, number] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#374151' }] },
                { text: `Dr(a). ${provider?.name || ''}`, alignment: 'center' as const, margin: [0, 5] as [number, number] },
                { text: provider?.licenseNumber || '', alignment: 'center' as const, fontSize: 9, color: '#6B7280' },
              ],
            },
            { width: '*', text: '' },
          ],
        },
      ],
      styles: {
        header: { fontSize: 20, bold: true, color: '#1F2937' },
        invoiceTitle: { fontSize: 14, color: '#6B7280' },
        rxSymbol: { fontSize: 28, bold: true, color: '#2563EB', italics: true },
      },
      defaultStyle: { fontSize: 10, color: '#4B5563' },
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage} de ${pageCount} | Generado por MediCloud`,
        alignment: 'center' as const,
        fontSize: 8,
        color: '#9CA3AF',
        margin: [0, 20],
      }),
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  /**
   * Generates a PDF for a treatment plan
   */
  async generateTreatmentPlanPdf(treatmentPlanId: string): Promise<Buffer> {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      include: { items: { orderBy: { priority: 'asc' } } },
    });

    if (!plan) {
      throw new Error('Treatment plan not found');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: plan.patientId },
    });

    const provider = await this.prisma.user.findUnique({
      where: { id: plan.providerId },
    });

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: plan.tenantId },
    });

    const docDefinition: any = {
      content: [
        {
          columns: [
            { text: tenant?.name || 'MediCloud', style: 'header', width: '*' },
            {
              text: [
                { text: 'PLAN DE TRATAMIENTO\n', style: 'invoiceTitle' },
                { text: this.translatePlanStatus(plan.status), style: 'statusBadge' },
              ],
              alignment: 'right' as const,
              width: 'auto',
            },
          ],
        },
        { text: '', margin: [0, 15] as [number, number] },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Paciente:', style: 'sectionHeader' },
                { text: `${patient?.firstName || ''} ${patient?.lastName || ''}` },
                { text: patient?.phone || '' },
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: `Doctor(a): ${provider?.name || ''}`, alignment: 'right' as const },
                { text: `Fecha: ${this.formatDate(plan.createdAt)}`, alignment: 'right' as const },
              ],
            },
          ],
        },
        { text: '', margin: [0, 10] as [number, number] },
        ...(plan.title ? [{ text: plan.title, fontSize: 14, bold: true }] : []),
        ...(plan.description ? [{ text: plan.description, margin: [0, 5, 0, 0] as [number, number, number, number] }] : []),
        ...(plan.diagnosis ? [{ text: `Diagnóstico: ${plan.diagnosis}`, italics: true, margin: [0, 5, 0, 0] as [number, number, number, number] }] : []),
        { text: '', margin: [0, 15] as [number, number] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: '#', style: 'tableHeader' },
                { text: 'Procedimiento', style: 'tableHeader' },
                { text: 'Diente', style: 'tableHeader' },
                { text: 'Estado', style: 'tableHeader' },
                { text: 'Costo Est.', style: 'tableHeader', alignment: 'right' as const },
              ],
              ...plan.items.map((item, idx) => [
                { text: (idx + 1).toString(), alignment: 'center' as const },
                {
                  stack: [
                    { text: item.procedureName, bold: true },
                    ...(item.description ? [{ text: item.description, fontSize: 8, color: '#6B7280' }] : []),
                  ],
                },
                { text: item.tooth || '-', alignment: 'center' as const },
                { text: this.translateItemStatus(item.status) },
                { text: this.formatCurrency(item.estimatedCost), alignment: 'right' as const },
              ]),
            ],
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
            vLineWidth: () => 0,
            hLineColor: () => '#E5E7EB',
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
        { text: '', margin: [0, 15] as [number, number] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                body: [
                  [
                    { text: 'Costo Total Estimado:', alignment: 'right' as const, bold: true },
                    { text: this.formatCurrency(plan.totalCost), alignment: 'right' as const, bold: true, fontSize: 14 },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
      ],
      styles: {
        header: { fontSize: 22, bold: true, color: '#1F2937' },
        invoiceTitle: { fontSize: 14, color: '#6B7280' },
        statusBadge: { fontSize: 12, bold: true, color: '#2563EB' },
        sectionHeader: { fontSize: 12, bold: true, color: '#374151', margin: [0, 0, 0, 4] },
        tableHeader: { bold: true, fontSize: 11, color: '#374151', fillColor: '#F9FAFB' },
      },
      defaultStyle: { fontSize: 10, color: '#4B5563' },
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage} de ${pageCount} | Generado por MediCloud`,
        alignment: 'center' as const,
        fontSize: 8,
        color: '#9CA3AF',
        margin: [0, 20],
      }),
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      DRAFT: 'Borrador',
      SENT: 'Enviada',
      PAID: 'Pagada',
      OVERDUE: 'Vencida',
      CANCELLED: 'Cancelada',
    };
    return translations[status] || status;
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      DRAFT: '#6B7280',
      SENT: '#3B82F6',
      PAID: '#10B981',
      OVERDUE: '#EF4444',
      CANCELLED: '#9CA3AF',
    };
    return colors[status] || '#6B7280';
  }

  private translatePaymentMethod(method: string): string {
    const translations: Record<string, string> = {
      CASH: 'Efectivo',
      CREDIT_CARD: 'Tarjeta de crédito',
      DEBIT_CARD: 'Tarjeta de débito',
      BANK_TRANSFER: 'Transferencia',
      CHECK: 'Cheque',
      INSURANCE: 'Seguro',
      OTHER: 'Otro',
    };
    return translations[method] || method;
  }

  private translatePlanStatus(status: string): string {
    const translations: Record<string, string> = {
      DRAFT: 'Borrador',
      PROPOSED: 'Propuesto',
      ACCEPTED: 'Aceptado',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };
    return translations[status] || status;
  }

  private translateItemStatus(status: string): string {
    const translations: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };
    return translations[status] || status;
  }
}
