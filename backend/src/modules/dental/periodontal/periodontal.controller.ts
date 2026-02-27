import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PeriodontalService } from './periodontal.service';
import {
  CreatePeriodontalExamDto,
  UpdatePeriodontalExamDto,
  CreatePeriodontalReadingDto,
} from './dto/periodontal.dto';

@ApiTags('dental / periodontal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/dental/periodontal')
export class PeriodontalController {
  constructor(private readonly periodontalService: PeriodontalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new periodontal exam' })
  create(@Body() dto: CreatePeriodontalExamDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.periodontalService.create(providerId, tenantId, dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all periodontal exams for a patient' })
  findAllByPatient(@Param('patientId') patientId: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.periodontalService.findAllByPatient(patientId, tenantId);
  }

  @Get('patient/:patientId/comparison')
  @ApiOperation({ summary: 'Compare last 2 periodontal exams for a patient' })
  getComparison(@Param('patientId') patientId: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.periodontalService.getComparison(patientId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get periodontal exam by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.periodontalService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a periodontal exam' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePeriodontalExamDto,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.periodontalService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a periodontal exam' })
  remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.periodontalService.delete(id, tenantId);
  }

  @Post(':examId/readings')
  @ApiOperation({ summary: 'Add or update a tooth reading for an exam' })
  addReading(
    @Param('examId') examId: string,
    @Body() dto: CreatePeriodontalReadingDto,
  ) {
    return this.periodontalService.addReading(examId, dto);
  }
}
