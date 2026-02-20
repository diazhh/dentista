import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClinicalNotesService } from './clinical-notes.service';
import { CreateClinicalNoteDto, UpdateClinicalNoteDto } from './dto/clinical-notes.dto';

@ApiTags('general-medicine / clinical-notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/general-medicine/clinical-notes')
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new clinical note' })
  create(@Body() dto: CreateClinicalNoteDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.clinicalNotesService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clinical notes' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.clinicalNotesService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get clinical note by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.clinicalNotesService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a clinical note' })
  update(@Param('id') id: string, @Body() dto: UpdateClinicalNoteDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.clinicalNotesService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a clinical note' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.clinicalNotesService.delete(id, providerId, tenantId);
  }
}
