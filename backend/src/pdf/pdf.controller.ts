import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfService } from './pdf.service';

@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  private readonly logger = new Logger(PdfController.name);

  constructor(private readonly pdfService: PdfService) {}

  @Get('invoices/:id')
  async getInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    try {
      const buffer = await this.pdfService.generateInvoicePdf(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factura-${id.slice(0, 8)}.pdf"`,
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (error) {
      this.logger.error(`Failed to generate invoice PDF: ${error.message}`);
      throw new NotFoundException('Factura no encontrada');
    }
  }

  @Get('prescriptions/:id')
  async getPrescriptionPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      const buffer = await this.pdfService.generatePrescriptionPdf(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receta-${id.slice(0, 8)}.pdf"`,
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (error) {
      this.logger.error(`Failed to generate prescription PDF: ${error.message}`);
      throw new NotFoundException('Receta no encontrada');
    }
  }

  @Get('treatment-plans/:id')
  async getTreatmentPlanPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      const buffer = await this.pdfService.generateTreatmentPlanPdf(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="plan-${id.slice(0, 8)}.pdf"`,
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (error) {
      this.logger.error(`Failed to generate treatment plan PDF: ${error.message}`);
      throw new NotFoundException('Plan de tratamiento no encontrado');
    }
  }
}
