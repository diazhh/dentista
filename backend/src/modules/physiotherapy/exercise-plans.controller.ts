import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExercisePlansService } from './exercise-plans.service';
import { CreateExercisePlanDto, UpdateExercisePlanDto } from './dto/exercise-plans.dto';

@ApiTags('physiotherapy / exercise-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/physiotherapy/exercise-plans')
export class ExercisePlansController {
  constructor(private readonly exercisePlansService: ExercisePlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new exercise plan' })
  create(@Body() dto: CreateExercisePlanDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.exercisePlansService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exercise plans' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.exercisePlansService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exercise plan by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.exercisePlansService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an exercise plan' })
  update(@Param('id') id: string, @Body() dto: UpdateExercisePlanDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.exercisePlansService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an exercise plan' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.exercisePlansService.delete(id, providerId, tenantId);
  }
}
