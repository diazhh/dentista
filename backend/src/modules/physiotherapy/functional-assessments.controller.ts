import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FunctionalAssessmentsService } from './functional-assessments.service';
import { CreateFunctionalAssessmentDto, UpdateFunctionalAssessmentDto } from './dto/functional-assessments.dto';

@ApiTags('physiotherapy / functional-assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/physiotherapy/functional-assessments')
export class FunctionalAssessmentsController {
  constructor(private readonly functionalAssessmentsService: FunctionalAssessmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new functional assessment' })
  create(@Body() dto: CreateFunctionalAssessmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.functionalAssessmentsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all functional assessments' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.functionalAssessmentsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get functional assessment by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.functionalAssessmentsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a functional assessment' })
  update(@Param('id') id: string, @Body() dto: UpdateFunctionalAssessmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.functionalAssessmentsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a functional assessment' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.functionalAssessmentsService.delete(id, providerId, tenantId);
  }
}
