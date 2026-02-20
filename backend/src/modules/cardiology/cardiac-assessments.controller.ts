import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CardiacAssessmentsService } from './cardiac-assessments.service';
import { CreateCardiacAssessmentDto, UpdateCardiacAssessmentDto } from './dto/cardiac-assessments.dto';

@ApiTags('cardiology / cardiac-assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/cardiology/cardiac-assessments')
export class CardiacAssessmentsController {
  constructor(private readonly cardiacAssessmentsService: CardiacAssessmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cardiac assessment' })
  create(@Body() dto: CreateCardiacAssessmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.cardiacAssessmentsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cardiac assessments' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.cardiacAssessmentsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cardiac assessment by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.cardiacAssessmentsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cardiac assessment' })
  update(@Param('id') id: string, @Body() dto: UpdateCardiacAssessmentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.cardiacAssessmentsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cardiac assessment' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.cardiacAssessmentsService.delete(id, providerId, tenantId);
  }
}
