import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SkinLesionsService } from './skin-lesions.service';
import { CreateSkinLesionDto, UpdateSkinLesionDto } from './dto/skin-lesions.dto';

@ApiTags('dermatology / skin-lesions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/dermatology/skin-lesions')
export class SkinLesionsController {
  constructor(private readonly skinLesionsService: SkinLesionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new skin lesion record' })
  create(@Body() dto: CreateSkinLesionDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.skinLesionsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all skin lesion records' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.skinLesionsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skin lesion record by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.skinLesionsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a skin lesion record' })
  update(@Param('id') id: string, @Body() dto: UpdateSkinLesionDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.skinLesionsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a skin lesion record' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.skinLesionsService.delete(id, providerId, tenantId);
  }
}
