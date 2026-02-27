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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { LabCasesService } from './lab-cases.service';
import {
  CreateLabCaseDto,
  UpdateLabCaseDto,
  UpdateLabCaseStatusDto,
} from './dto/lab-cases.dto';

@ApiTags('dental / lab-cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/dental/lab-cases')
export class LabCasesController {
  constructor(private readonly labCasesService: LabCasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lab case' })
  create(@Body() dto: CreateLabCaseDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.labCasesService.create(providerId, tenantId, dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: "Get patient's lab cases" })
  findAllByPatient(@Param('patientId') patientId: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.labCasesService.findAllByPatient(patientId, tenantId);
  }

  @Get('provider')
  @ApiOperation({ summary: "Get provider's lab cases" })
  @ApiQuery({ name: 'status', required: false })
  findAllByProvider(@Request() req, @Query('status') status?: string) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.labCasesService.findAllByProvider(providerId, tenantId, {
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lab case detail' })
  findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.labCasesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lab case' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLabCaseDto,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.labCasesService.update(id, tenantId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Quick status update for a lab case' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLabCaseStatusDto,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.labCasesService.updateStatus(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lab case' })
  remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.labCasesService.delete(id, tenantId);
  }
}
