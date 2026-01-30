import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(
      createInvoiceDto,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  findAll(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAll(req.user.userId, req.user.tenantId, patientId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.userId, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice' })
  update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req,
  ) {
    return this.invoicesService.update(
      id,
      updateInvoiceDto,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update invoice status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req,
  ) {
    return this.invoicesService.updateStatus(
      id,
      status,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Param('id') id: string, @Request() req) {
    return this.invoicesService.remove(id, req.user.userId, req.user.tenantId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @ApiProduces('application/pdf')
  async downloadPdf(@Param('id') id: string, @Request() req, @Res() res: Response) {
    // First verify access to the invoice
    const invoice = await this.invoicesService.findOne(id, req.user.userId, req.user.tenantId);

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateInvoicePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
