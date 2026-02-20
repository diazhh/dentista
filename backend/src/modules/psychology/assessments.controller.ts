import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/assessments.dto';

@ApiTags('psychology / assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/psychology/assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new psychological assessment (score auto-calculated for PHQ-9/GAD-7)' })
  create(@Body() dto: CreateAssessmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.assessmentsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all psychological assessments' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.assessmentsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get psychological assessment by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.assessmentsService.findOne(id, providerId, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a psychological assessment' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.assessmentsService.delete(id, providerId, tenantId);
  }
}
