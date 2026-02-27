import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { FeeScheduleService } from './fee-schedule.service';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  CreateFeeScheduleItemDto,
  UpdateFeeScheduleItemDto,
} from './dto/fee-schedule.dto';

@ApiTags('dental / fee-schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/dental/fee-schedule')
export class FeeScheduleController {
  constructor(private readonly feeScheduleService: FeeScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new fee schedule with optional items' })
  create(@Body() dto: CreateFeeScheduleDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.feeScheduleService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all fee schedules for the tenant' })
  findAll(@Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.feeScheduleService.findAll(tenantId);
  }

  @Get('lookup/:cdtCode')
  @ApiOperation({ summary: 'Look up fee for a CDT code' })
  @ApiQuery({ name: 'scheduleId', required: false, description: 'Optional specific schedule ID' })
  lookupFee(
    @Param('cdtCode') cdtCode: string,
    @Request() req,
    @Query('scheduleId') scheduleId?: string,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.feeScheduleService.lookupFee(tenantId, cdtCode, scheduleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fee schedule with all items' })
  findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.feeScheduleService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a fee schedule' })
  update(@Param('id') id: string, @Body() dto: UpdateFeeScheduleDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.feeScheduleService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a fee schedule and all its items' })
  remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.feeScheduleService.delete(id, tenantId);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add an item to a fee schedule' })
  addItem(@Param('id') scheduleId: string, @Body() dto: CreateFeeScheduleItemDto) {
    return this.feeScheduleService.addItem(scheduleId, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update a fee schedule item' })
  updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateFeeScheduleItemDto) {
    return this.feeScheduleService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Delete a fee schedule item' })
  removeItem(@Param('itemId') itemId: string) {
    return this.feeScheduleService.deleteItem(itemId);
  }
}
