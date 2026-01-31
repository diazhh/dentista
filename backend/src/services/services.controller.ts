import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dental service' })
  create(@Body() createServiceDto: CreateServiceDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.servicesService.create(createServiceDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dental services' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'includeInactive', required: false, description: 'Include inactive services' })
  findAll(
    @Request() req,
    @Query('category') category?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    const activeOnly = includeInactive !== 'true';
    return this.servicesService.findAll(tenantId, category, activeOnly);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all service categories' })
  getCategories(@Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.servicesService.getCategories(tenantId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get service by code' })
  findByCode(@Param('code') code: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.servicesService.findByCode(code, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.servicesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dental service' })
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.servicesService.update(id, updateServiceDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (deactivate) a dental service' })
  remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.servicesService.remove(id, tenantId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default dental services for the tenant' })
  seedDefaultServices(@Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.servicesService.seedDefaultServices(tenantId);
  }
}
