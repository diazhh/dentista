import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async getAllPlans(@Query('includeInactive') includeInactive?: string) {
    return this.plansService.findAll(includeInactive === 'true');
  }

  @Get('statistics')
  async getStatistics() {
    return this.plansService.getStatistics();
  }

  @Get(':id')
  async getPlanById(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Post()
  async createPlan(@Body() data: {
    name: string;
    code: string;
    description?: string;
    monthlyPrice: number;
    yearlyPrice?: number;
    currency?: string;
    maxPatients: number;
    maxUsers: number;
    storageGB: number;
    features?: string[];
    isPublic?: boolean;
    sortOrder?: number;
  }, @Request() req) {
    return this.plansService.create(data, req.user.userId);
  }

  @Put(':id')
  async updatePlan(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      description?: string;
      monthlyPrice?: number;
      yearlyPrice?: number;
      maxPatients?: number;
      maxUsers?: number;
      storageGB?: number;
      features?: string[];
      isPublic?: boolean;
      sortOrder?: number;
    },
    @Request() req
  ) {
    return this.plansService.update(id, data, req.user.userId);
  }

  @Delete(':id')
  async deletePlan(@Param('id') id: string, @Request() req) {
    return this.plansService.delete(id, req.user.userId);
  }

  @Post(':id/activate')
  async activatePlan(@Param('id') id: string, @Request() req) {
    return this.plansService.activate(id, req.user.userId);
  }

  @Post(':id/deactivate')
  async deactivatePlan(@Param('id') id: string, @Request() req) {
    return this.plansService.deactivate(id, req.user.userId);
  }
}
