import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TherapySessionsService } from './therapy-sessions.service';
import { CreateTherapySessionDto, UpdateTherapySessionDto } from './dto/therapy-sessions.dto';

@ApiTags('psychology / therapy-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/psychology/therapy-sessions')
export class TherapySessionsController {
  constructor(private readonly therapySessionsService: TherapySessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new therapy session (sessionNumber auto-calculated)' })
  create(@Body() dto: CreateTherapySessionDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.therapySessionsService.create(providerId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all therapy sessions' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.therapySessionsService.findAll(providerId, tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get therapy session by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.therapySessionsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a therapy session' })
  update(@Param('id') id: string, @Body() dto: UpdateTherapySessionDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.therapySessionsService.update(id, providerId, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a therapy session' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.therapySessionsService.delete(id, providerId, tenantId);
  }
}
