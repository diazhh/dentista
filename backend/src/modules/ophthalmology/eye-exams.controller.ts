import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EyeExamsService } from './eye-exams.service';
import { CreateEyeExamDto, UpdateEyeExamDto } from './dto/eye-exams.dto';

@ApiTags('ophthalmology / eye-exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/ophthalmology/eye-exams')
export class EyeExamsController {
  constructor(private readonly eyeExamsService: EyeExamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new eye exam' })
  create(@Body() dto: CreateEyeExamDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.eyeExamsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all eye exams' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.eyeExamsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get eye exam by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.eyeExamsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an eye exam' })
  update(@Param('id') id: string, @Body() dto: UpdateEyeExamDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.eyeExamsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an eye exam' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.eyeExamsService.delete(id, providerId, tenantId);
  }
}
