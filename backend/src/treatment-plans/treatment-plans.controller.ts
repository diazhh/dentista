import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TreatmentPlansService } from './treatment-plans.service';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { UpdateTreatmentItemDto } from './dto/update-treatment-item.dto';

@ApiTags('treatment-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('treatment-plans')
export class TreatmentPlansController {
  constructor(private readonly treatmentPlansService: TreatmentPlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create treatment plan' })
  create(@Body() createTreatmentPlanDto: CreateTreatmentPlanDto, @Request() req) {
    return this.treatmentPlansService.create(
      createTreatmentPlanDto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all treatment plans' })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    return this.treatmentPlansService.findAll(req.user.sub, req.user.tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get treatment plan by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.treatmentPlansService.findOne(id, req.user.sub, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update treatment plan' })
  update(
    @Param('id') id: string,
    @Body() updateTreatmentPlanDto: UpdateTreatmentPlanDto,
    @Request() req,
  ) {
    return this.treatmentPlansService.update(
      id,
      updateTreatmentPlanDto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update treatment plan item status' })
  updateItem(
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateTreatmentItemDto,
    @Request() req,
  ) {
    return this.treatmentPlansService.updateItem(
      itemId,
      updateItemDto,
      req.user.sub,
      req.user.tenantId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete treatment plan' })
  remove(@Param('id') id: string, @Request() req) {
    return this.treatmentPlansService.remove(id, req.user.sub, req.user.tenantId);
  }
}
