import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailConfigService } from './email-config.service';
import { EmailTemplateService } from './email-template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailConfigService: EmailConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  // Email Configuration endpoints
  @Get('config')
  async getActiveConfig() {
    return this.emailConfigService.getActiveConfig();
  }

  @Get('config/all')
  async getAllConfigs() {
    return this.emailConfigService.getAllConfigs();
  }

  @Get('config/:id')
  async getConfigById(@Param('id') id: string) {
    return this.emailConfigService.getConfigById(id);
  }

  @Post('config')
  async createConfig(@Body() data: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
  }, @Request() req) {
    return this.emailConfigService.createConfig(data, req.user.userId);
  }

  @Put('config/:id')
  async updateConfig(
    @Param('id') id: string,
    @Body() data: {
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
      smtpSecure?: boolean;
      fromEmail?: string;
      fromName?: string;
      replyToEmail?: string;
    },
    @Request() req
  ) {
    return this.emailConfigService.updateConfig(id, data, req.user.userId);
  }

  @Delete('config/:id')
  async deleteConfig(@Param('id') id: string, @Request() req) {
    return this.emailConfigService.deleteConfig(id, req.user.userId);
  }

  @Post('config/:id/activate')
  async activateConfig(@Param('id') id: string, @Request() req) {
    return this.emailConfigService.activateConfig(id, req.user.userId);
  }

  @Post('config/:id/test')
  async testConfig(@Param('id') id: string, @Body() data: { testEmail: string }) {
    return this.emailService.testConnection(id, data.testEmail);
  }

  // Email Template endpoints
  @Get('templates')
  async getAllTemplates(@Query('includeInactive') includeInactive?: string) {
    return this.emailTemplateService.findAll(includeInactive === 'true');
  }

  @Get('templates/statistics')
  async getTemplateStatistics() {
    return this.emailTemplateService.getStatistics();
  }

  @Get('templates/:id')
  async getTemplateById(@Param('id') id: string) {
    return this.emailTemplateService.findById(id);
  }

  @Post('templates')
  async createTemplate(@Body() data: {
    type: string;
    name: string;
    description?: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    variables?: string[];
  }, @Request() req) {
    return this.emailTemplateService.create(data as any, req.user.userId);
  }

  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      description?: string;
      subject?: string;
      htmlBody?: string;
      textBody?: string;
      variables?: string[];
      isActive?: boolean;
    },
    @Request() req
  ) {
    return this.emailTemplateService.update(id, data, req.user.userId);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string, @Request() req) {
    return this.emailTemplateService.delete(id, req.user.userId);
  }

  @Post('templates/:id/activate')
  async activateTemplate(@Param('id') id: string, @Request() req) {
    return this.emailTemplateService.activate(id, req.user.userId);
  }

  @Post('templates/:id/deactivate')
  async deactivateTemplate(@Param('id') id: string, @Request() req) {
    return this.emailTemplateService.deactivate(id, req.user.userId);
  }

  // Email Logs endpoints
  @Get('logs')
  async getEmailLogs(@Query('templateId') templateId?: string, @Query('limit') limit?: string) {
    return this.emailTemplateService.getEmailLogs(templateId, limit ? parseInt(limit) : 50);
  }

  // Send email endpoint
  @Post('send')
  async sendEmail(@Body() data: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    return this.emailService.sendEmail(data);
  }

  @Post('send-template')
  async sendTemplateEmail(@Body() data: {
    templateType: string;
    to: string;
    variables: Record<string, any>;
  }) {
    return this.emailService.sendTemplateEmail(data.templateType, data.to, data.variables);
  }
}
