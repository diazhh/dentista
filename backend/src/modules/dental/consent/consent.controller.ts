import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ConsentService } from './consent.service';
import { CreateProcedureConsentDto, SignConsentDto } from './dto/consent.dto';

@ApiTags('dental / consent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules/dental/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new procedure consent form' })
  create(@Body() dto: CreateProcedureConsentDto, @Request() req) {
    const providerId = req.user.userId;
    const tenantId = req.user.tenantId || providerId;
    return this.consentService.create(providerId, tenantId, dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all consent forms for a patient' })
  findAllByPatient(@Param('patientId') patientId: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.consentService.findAllByPatient(patientId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a procedure consent by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.consentService.findOne(id, tenantId);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Sign a procedure consent form' })
  sign(@Param('id') id: string, @Body() dto: SignConsentDto, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.consentService.sign(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a procedure consent form' })
  remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId || req.user.userId;
    return this.consentService.delete(id, tenantId);
  }
}
