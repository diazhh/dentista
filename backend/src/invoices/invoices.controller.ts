import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(
      createInvoiceDto,
      req.user.sub,
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
    return this.invoicesService.findAll(req.user.sub, req.user.tenantId, patientId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.sub, req.user.tenantId);
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
      req.user.sub,
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
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Param('id') id: string, @Request() req) {
    return this.invoicesService.remove(id, req.user.sub, req.user.tenantId);
  }
}
