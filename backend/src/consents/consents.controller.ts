import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConsentsService } from './consents.service';
import { RequestConsentDto } from './dto/request-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

@ApiTags('Consents')
@Controller('consents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  // ==========================================
  // Provider endpoints
  // ==========================================

  @Post('request')
  @ApiOperation({ summary: 'Provider requests consent from a patient' })
  @ApiResponse({ status: 201, description: 'Consent request created' })
  @ApiResponse({ status: 400, description: 'Consent already exists or pending' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  requestConsent(@Request() req, @Body() dto: RequestConsentDto) {
    return this.consentsService.requestConsent(
      req.user.userId,
      req.user.tenantId,
      dto,
    );
  }

  // ==========================================
  // Patient endpoints
  // ==========================================

  @Get('pending')
  @ApiOperation({ summary: 'Patient views pending consent requests' })
  @ApiResponse({ status: 200, description: 'List of pending consent requests' })
  getPending(@Request() req) {
    return this.consentsService.getPendingForPatient(req.user.userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Patient views active (granted) consents' })
  @ApiResponse({ status: 200, description: 'List of active consents' })
  getActive(@Request() req) {
    return this.consentsService.getActiveForPatient(req.user.userId);
  }

  @Post(':id/grant')
  @ApiOperation({ summary: 'Patient grants a pending consent request' })
  @ApiResponse({ status: 200, description: 'Consent granted' })
  @ApiResponse({ status: 404, description: 'Pending consent not found' })
  grantConsent(@Request() req, @Param('id') id: string) {
    return this.consentsService.grantConsent(req.user.userId, id);
  }

  @Post(':id/deny')
  @ApiOperation({ summary: 'Patient denies a pending consent request' })
  @ApiResponse({ status: 200, description: 'Consent denied' })
  @ApiResponse({ status: 404, description: 'Pending consent not found' })
  denyConsent(@Request() req, @Param('id') id: string) {
    return this.consentsService.denyConsent(req.user.userId, id);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Patient revokes a previously granted consent' })
  @ApiResponse({ status: 200, description: 'Consent revoked' })
  @ApiResponse({ status: 404, description: 'Active consent not found' })
  revokeConsent(@Request() req, @Param('id') id: string) {
    return this.consentsService.revokeConsent(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Patient updates access levels on an active consent' })
  @ApiResponse({ status: 200, description: 'Consent updated' })
  @ApiResponse({ status: 404, description: 'Active consent not found' })
  updateConsent(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateConsentDto,
  ) {
    return this.consentsService.updateConsent(req.user.userId, id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Patient views full consent history' })
  @ApiResponse({ status: 200, description: 'Complete consent history' })
  getHistory(@Request() req) {
    return this.consentsService.getConsentHistory(req.user.userId);
  }
}
