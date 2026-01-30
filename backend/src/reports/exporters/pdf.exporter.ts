import { Injectable, Logger } from '@nestjs/common';

// Using pdfmake for PDF generation
const PdfPrinter = require('pdfmake');
const fonts = {
  Roboto: {
    normal: 'node_modules/pdfmake/build/vfs_fonts.js',
    bold: 'node_modules/pdfmake/build/vfs_fonts.js',
    italics: 'node_modules/pdfmake/build/vfs_fonts.js',
    bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js',
  },
};

export interface PdfColumn {
  header: string;
  key: string;
  width?: string | number;
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  data: Record<string, any>[];
  summaryData?: Record<string, any>;
  orientation?: 'portrait' | 'landscape';
}

@Injectable()
export class PdfExporter {
  private readonly logger = new Logger(PdfExporter.name);

  /**
   * Export data to PDF buffer
   */
  async export(options: PdfExportOptions): Promise<Buffer> {
    const {
      title,
      subtitle,
      columns,
      data,
      summaryData,
      orientation = 'portrait',
    } = options;

    const content: any[] = [];

    // Title
    content.push({
      text: title,
      style: 'header',
      alignment: 'center',
      margin: [0, 0, 0, 10],
    });

    // Subtitle (timestamp)
    content.push({
      text: subtitle || `Generated: ${new Date().toLocaleString()}`,
      style: 'subheader',
      alignment: 'center',
      margin: [0, 0, 0, 20],
    });

    // Summary section
    if (summaryData && Object.keys(summaryData).length > 0) {
      content.push({
        text: 'Summary',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10],
      });

      const summaryTable = {
        table: {
          widths: ['auto', '*'],
          body: Object.entries(summaryData).map(([key, value]) => [
            { text: this.formatLabel(key), bold: true },
            { text: String(value) },
          ]),
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      };

      content.push(summaryTable);
    }

    // Data table
    if (data.length > 0) {
      content.push({
        text: 'Details',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10],
      });

      const tableWidths = columns.map((col) => col.width || '*');
      const tableBody = [
        // Header row
        columns.map((col) => ({
          text: col.header,
          style: 'tableHeader',
          fillColor: '#4472C4',
          color: 'white',
        })),
        // Data rows
        ...data.map((row, index) =>
          columns.map((col) => ({
            text: String(row[col.key] ?? ''),
            fillColor: index % 2 === 1 ? '#F2F2F2' : null,
          })),
        ),
      ];

      content.push({
        table: {
          headerRows: 1,
          widths: tableWidths,
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#CCCCCC',
          vLineColor: () => '#CCCCCC',
        },
      });
    }

    // Footer
    content.push({
      text: '\n\nDentiCloud - Dental Practice Management',
      style: 'footer',
      alignment: 'center',
      margin: [0, 20, 0, 0],
    });

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: orientation,
      pageMargins: [40, 60, 40, 60],
      content,
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          color: '#2E4057',
        },
        subheader: {
          fontSize: 10,
          color: '#666666',
          italics: true,
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#4472C4',
        },
        tableHeader: {
          fontSize: 11,
          bold: true,
        },
        footer: {
          fontSize: 9,
          color: '#999999',
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
    };

    return this.generatePdfBuffer(docDefinition);
  }

  /**
   * Generate PDF buffer from doc definition
   */
  private generatePdfBuffer(docDefinition: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Use a simpler approach with pdfmake's virtual file system
        const pdfMake = require('pdfmake/build/pdfmake');
        const pdfFonts = require('pdfmake/build/vfs_fonts');
        pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

        const pdfDocGenerator = pdfMake.createPdf(docDefinition);

        pdfDocGenerator.getBuffer((buffer: Buffer) => {
          resolve(buffer);
        });
      } catch (error) {
        this.logger.error('Error generating PDF', error);
        reject(error);
      }
    });
  }

  /**
   * Export financial report to PDF
   */
  async exportFinancialReport(data: any): Promise<Buffer> {
    const columns: PdfColumn[] = [
      { header: 'Status', key: 'status', width: 'auto' },
      { header: 'Count', key: 'count', width: 'auto' },
      { header: 'Total', key: 'total', width: '*' },
      { header: 'Paid', key: 'amountPaid', width: '*' },
      { header: 'Balance', key: 'balance', width: '*' },
    ];

    return this.export({
      title: 'Financial Report',
      columns,
      data:
        data.invoicesByStatus?.map((s: any) => ({
          ...s,
          total: `$${s.total?.toFixed(2) || 0}`,
          amountPaid: `$${s.amountPaid?.toFixed(2) || 0}`,
          balance: `$${s.balance?.toFixed(2) || 0}`,
        })) || [],
      summaryData: {
        'Total Revenue': `$${data.summary?.totalRevenue?.toFixed(2) || 0}`,
        'Pending Amount': `$${data.summary?.pendingAmount?.toFixed(2) || 0}`,
        'Invoice Count': data.summary?.invoiceCount || 0,
        'Period': `${data.period?.startDate?.toLocaleDateString() || 'N/A'} - ${data.period?.endDate?.toLocaleDateString() || 'N/A'}`,
      },
    });
  }

  /**
   * Export appointment statistics to PDF
   */
  async exportAppointmentStats(data: any): Promise<Buffer> {
    const columns: PdfColumn[] = [
      { header: 'Status', key: 'status', width: '*' },
      { header: 'Count', key: 'count', width: 'auto' },
      { header: '%', key: 'percentage', width: 'auto' },
    ];

    return this.export({
      title: 'Appointment Statistics',
      columns,
      data:
        data.byStatus?.map((s: any) => ({
          ...s,
          percentage: `${s.percentage}%`,
        })) || [],
      summaryData: {
        'Total Appointments': data.summary?.total || 0,
        'Completed': data.summary?.completed || 0,
        'Cancelled': data.summary?.cancelled || 0,
        'No Shows': data.summary?.noShows || 0,
        'No Show Rate': `${data.summary?.noShowRate || 0}%`,
        'Completion Rate': `${data.summary?.completionRate || 0}%`,
        'Avg Duration': `${data.summary?.avgDuration || 0} min`,
      },
    });
  }

  /**
   * Export patient statistics to PDF
   */
  async exportPatientStats(data: any): Promise<Buffer> {
    const columns: PdfColumn[] = [
      { header: 'Age Group', key: 'group', width: '*' },
      { header: 'Count', key: 'count', width: 'auto' },
      { header: '%', key: 'percentage', width: 'auto' },
    ];

    return this.export({
      title: 'Patient Statistics',
      columns,
      data:
        data.byAgeGroup?.map((g: any) => ({
          ...g,
          percentage: `${g.percentage}%`,
        })) || [],
      summaryData: {
        'Total Active': data.summary?.totalActive || 0,
        'New in Period': data.summary?.newInPeriod || 0,
        'Portal Enabled': data.summary?.portalEnabled || 0,
        'Portal Adoption': `${data.summary?.portalAdoptionRate || 0}%`,
      },
    });
  }

  /**
   * Export treatment plan statistics to PDF
   */
  async exportTreatmentPlanStats(data: any): Promise<Buffer> {
    const columns: PdfColumn[] = [
      { header: 'Status', key: 'status', width: '*' },
      { header: 'Count', key: 'count', width: 'auto' },
      { header: 'Value', key: 'totalValue', width: '*' },
      { header: '%', key: 'percentage', width: 'auto' },
    ];

    return this.export({
      title: 'Treatment Plan Statistics',
      columns,
      data:
        data.byStatus?.map((s: any) => ({
          ...s,
          totalValue: `$${s.totalValue?.toFixed(2) || 0}`,
          percentage: `${s.percentage}%`,
        })) || [],
      summaryData: {
        'Total Plans': data.summary?.total || 0,
        'Acceptance Rate': `${data.summary?.acceptanceRate || 0}%`,
        'Total Value': `$${data.summary?.totalValue?.toFixed(2) || 0}`,
      },
    });
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
