import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GynecologicalExamsService } from './gynecological-exams.service';
import { CreateGynecologicalExamDto, UpdateGynecologicalExamDto } from './dto/gynecological-exams.dto';

@ApiTags('gynecology / gynecological-exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/gynecology/gynecological-exams')
export class GynecologicalExamsController {
  constructor(private readonly gynecologicalExamsService: GynecologicalExamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new gynecological exam' })
  create(@Body() dto: CreateGynecologicalExamDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.gynecologicalExamsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gynecological exams' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.gynecologicalExamsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gynecological exam by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.gynecologicalExamsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a gynecological exam' })
  update(@Param('id') id: string, @Body() dto: UpdateGynecologicalExamDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.gynecologicalExamsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a gynecological exam' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.gynecologicalExamsService.delete(id, providerId, tenantId);
  }
}
