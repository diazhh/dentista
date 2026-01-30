import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

export interface ExportOptions {
  title?: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  summaryData?: Record<string, any>;
  includeTimestamp?: boolean;
}

@Injectable()
export class ExcelExporter {
  private readonly logger = new Logger(ExcelExporter.name);

  /**
   * Export data to Excel buffer
   */
  async export(options: ExportOptions): Promise<Buffer> {
    const {
      title = 'Report',
      sheetName = 'Data',
      columns,
      data,
      summaryData,
      includeTimestamp = true,
    } = options;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DentiCloud';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName);

    // Add title row
    let currentRow = 1;
    if (title) {
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      const titleCell = worksheet.getCell(currentRow, 1);
      titleCell.value = title;
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: 'center' };
      currentRow += 1;
    }

    // Add timestamp
    if (includeTimestamp) {
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      const timestampCell = worksheet.getCell(currentRow, 1);
      timestampCell.value = `Generated: ${new Date().toLocaleString()}`;
      timestampCell.font = { italic: true, size: 10, color: { argb: '666666' } };
      timestampCell.alignment = { horizontal: 'center' };
      currentRow += 2; // Add empty row
    }

    // Add summary data if provided
    if (summaryData && Object.keys(summaryData).length > 0) {
      const summaryStartRow = currentRow;
      worksheet.getCell(currentRow, 1).value = 'Summary';
      worksheet.getCell(currentRow, 1).font = { bold: true, size: 12 };
      currentRow += 1;

      for (const [key, value] of Object.entries(summaryData)) {
        worksheet.getCell(currentRow, 1).value = this.formatLabel(key);
        worksheet.getCell(currentRow, 1).font = { bold: true };
        worksheet.getCell(currentRow, 2).value = value;
        currentRow += 1;
      }

      currentRow += 1; // Add empty row after summary
    }

    // Set up columns for data
    worksheet.columns = columns.map((col) => ({
      key: col.key,
      width: col.width || 15,
    }));

    // Add header row
    const headerRow = worksheet.getRow(currentRow);
    columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow += 1;

    // Add data rows
    data.forEach((row, rowIndex) => {
      const dataRow = worksheet.getRow(currentRow + rowIndex);
      columns.forEach((col, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        cell.value = row[col.key];
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        // Apply custom style if provided
        if (col.style) {
          Object.assign(cell, col.style);
        }
      });
      // Alternate row colors
      if (rowIndex % 2 === 1) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' },
          };
        });
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export financial report to Excel
   */
  async exportFinancialReport(data: any): Promise<Buffer> {
    const columns: ExportColumn[] = [
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Count', key: 'count', width: 10 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Amount Paid', key: 'amountPaid', width: 15 },
      { header: 'Balance', key: 'balance', width: 15 },
    ];

    return this.export({
      title: 'Financial Report',
      sheetName: 'Financial',
      columns,
      data: data.invoicesByStatus || [],
      summaryData: {
        'Total Revenue': `$${data.summary?.totalRevenue?.toFixed(2) || 0}`,
        'Pending Amount': `$${data.summary?.pendingAmount?.toFixed(2) || 0}`,
        'Invoice Count': data.summary?.invoiceCount || 0,
        'Period Start': data.period?.startDate?.toLocaleDateString() || 'N/A',
        'Period End': data.period?.endDate?.toLocaleDateString() || 'N/A',
      },
    });
  }

  /**
   * Export appointment statistics to Excel
   */
  async exportAppointmentStats(data: any): Promise<Buffer> {
    const columns: ExportColumn[] = [
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Count', key: 'count', width: 10 },
      { header: 'Percentage', key: 'percentage', width: 12 },
    ];

    return this.export({
      title: 'Appointment Statistics',
      sheetName: 'Appointments',
      columns,
      data:
        data.byStatus?.map((s: any) => ({
          ...s,
          percentage: `${s.percentage}%`,
        })) || [],
      summaryData: {
        'Total Appointments': data.summary?.total || 0,
        Completed: data.summary?.completed || 0,
        Cancelled: data.summary?.cancelled || 0,
        'No Shows': data.summary?.noShows || 0,
        'No Show Rate': `${data.summary?.noShowRate || 0}%`,
        'Completion Rate': `${data.summary?.completionRate || 0}%`,
        'Average Duration': `${data.summary?.avgDuration || 0} min`,
      },
    });
  }

  /**
   * Export patient statistics to Excel
   */
  async exportPatientStats(data: any): Promise<Buffer> {
    const columns: ExportColumn[] = [
      { header: 'Age Group', key: 'group', width: 15 },
      { header: 'Count', key: 'count', width: 10 },
      { header: 'Percentage', key: 'percentage', width: 12 },
    ];

    return this.export({
      title: 'Patient Statistics',
      sheetName: 'Patients',
      columns,
      data:
        data.byAgeGroup?.map((g: any) => ({
          ...g,
          percentage: `${g.percentage}%`,
        })) || [],
      summaryData: {
        'Total Active Patients': data.summary?.totalActive || 0,
        'New in Period': data.summary?.newInPeriod || 0,
        'Portal Enabled': data.summary?.portalEnabled || 0,
        'Portal Adoption Rate': `${data.summary?.portalAdoptionRate || 0}%`,
      },
    });
  }

  /**
   * Export treatment plan statistics to Excel
   */
  async exportTreatmentPlanStats(data: any): Promise<Buffer> {
    const columns: ExportColumn[] = [
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Count', key: 'count', width: 10 },
      { header: 'Total Value', key: 'totalValue', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 12 },
    ];

    return this.export({
      title: 'Treatment Plan Statistics',
      sheetName: 'Treatment Plans',
      columns,
      data:
        data.byStatus?.map((s: any) => ({
          ...s,
          totalValue: `$${s.totalValue?.toFixed(2) || 0}`,
          percentage: `${s.percentage}%`,
        })) || [],
      summaryData: {
        'Total Plans': data.summary?.total || 0,
        Proposed: data.summary?.proposed || 0,
        Accepted: data.summary?.accepted || 0,
        'In Progress': data.summary?.inProgress || 0,
        Completed: data.summary?.completed || 0,
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
