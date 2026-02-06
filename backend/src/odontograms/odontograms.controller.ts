import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OdontogramsService } from './odontograms.service';
import { CreateOdontogramDto } from './dto/create-odontogram.dto';
import { UpdateOdontogramDto } from './dto/update-odontogram.dto';

@ApiTags('odontograms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('odontograms')
export class OdontogramsController {
  constructor(private readonly odontogramsService: OdontogramsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new odontogram' })
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
  @ApiOperation({ summary: 'Get latest odontogram for a patient' })
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
  @ApiOperation({ summary: 'Update odontogram' })
  update(
    @Param('id') id: string,
    @Body() updateOdontogramDto: UpdateOdontogramDto,
    @Request() req,
  ) {
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
}
