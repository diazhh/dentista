import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.create(createPaymentDto, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  findAll(
    @Request() req,
    @Query('invoiceId') invoiceId?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.paymentsService.findAll(req.user.tenantId, invoiceId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.paymentsService.findOne(id, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment' })
  remove(@Param('id') id: string, @Request() req) {
    return this.paymentsService.remove(id, req.user.tenantId);
  }
}
