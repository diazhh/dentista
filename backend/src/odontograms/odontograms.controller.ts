import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OdontogramsService } from './odontograms.service';
import { CreateOdontogramDto, CreateToothDto } from './dto/create-odontogram.dto';
import { UpdateOdontogramDto } from './dto/update-odontogram.dto';
import { UpdateFromProcedureDto } from './dto/update-odontogram.dto';

@ApiTags('odontograms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('odontograms')
export class OdontogramsController {
  constructor(private readonly odontogramsService: OdontogramsService) {}

  @Post()
  @ApiOperation({ summary: 'Create initial odontogram for a patient (1 per patient)' })
  create(@Body() createOdontogramDto: CreateOdontogramDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.create(createOdontogramDto, providerId, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all odontograms' })
  @ApiQuery({ name: 'patientId', required: false })
  findAll(@Request() req, @Query('patientId') patientId?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.findAll(providerId, tenantId, patientId);
  }

  @Get('patient/:patientId/latest')
  @ApiOperation({ summary: 'Get the odontogram for a patient (single per patient)' })
  getLatestByPatient(@Param('patientId') patientId: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.getLatestByPatient(patientId, providerId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get odontogram by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.findOne(id, providerId, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update odontogram notes' })
  update(@Param('id') id: string, @Body() updateOdontogramDto: UpdateOdontogramDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.update(id, updateOdontogramDto, providerId, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete odontogram' })
  remove(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.remove(id, providerId, tenantId);
  }

  // === Tooth-level endpoints ===

  @Post(':id/teeth')
  @ApiOperation({ summary: 'Add or update a tooth in the odontogram' })
  addTooth(@Param('id') id: string, @Body() toothDto: CreateToothDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.addTooth(id, toothDto, providerId, tenantId);
  }

  @Patch(':id/teeth/:toothId')
  @ApiOperation({ summary: 'Update a specific tooth (with history tracking)' })
  updateTooth(@Param('id') id: string, @Param('toothId') toothId: string, @Body() toothDto: Partial<CreateToothDto>, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.updateTooth(id, toothId, toothDto, providerId, tenantId);
  }

  @Delete(':id/teeth/:toothId')
  @ApiOperation({ summary: 'Remove a tooth from the odontogram' })
  removeTooth(@Param('id') id: string, @Param('toothId') toothId: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.removeTooth(id, toothId, providerId, tenantId);
  }

  // === History endpoints ===

  @Get(':id/history')
  @ApiOperation({ summary: 'Get all tooth change history for an odontogram' })
  getOdontogramHistory(@Param('id') id: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.getOdontogramHistory(id, providerId, tenantId);
  }

  @Get(':id/teeth/:toothId/history')
  @ApiOperation({ summary: 'Get history for a specific tooth' })
  getToothHistory(@Param('id') id: string, @Param('toothId') toothId: string, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.getToothHistory(id, toothId, providerId, tenantId);
  }

  // === Procedure integration ===

  @Post('patient/:patientId/update-from-procedure')
  @ApiOperation({ summary: 'Update odontogram tooth from a completed procedure' })
  updateFromProcedure(
    @Param('patientId') patientId: string,
    @Body() dto: UpdateFromProcedureDto,
    @Request() req,
  ) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.odontogramsService.updateFromProcedure(patientId, dto, providerId, tenantId);
  }
}
