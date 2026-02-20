import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NutritionPlansService } from './nutrition-plans.service';
import { CreateNutritionPlanDto, UpdateNutritionPlanDto } from './dto/nutrition-plans.dto';

@ApiTags('nutrition / nutrition-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/nutrition/nutrition-plans')
export class NutritionPlansController {
  constructor(private readonly nutritionPlansService: NutritionPlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new nutrition plan' })
  create(@Body() dto: CreateNutritionPlanDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.nutritionPlansService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all nutrition plans' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.nutritionPlansService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get nutrition plan by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.nutritionPlansService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a nutrition plan' })
  update(@Param('id') id: string, @Body() dto: UpdateNutritionPlanDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.nutritionPlansService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a nutrition plan' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.nutritionPlansService.delete(id, providerId, tenantId);
  }
}
