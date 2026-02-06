import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ChatbotConfigService } from './chatbot-config.service';
import { ChatMetricsService } from './chat-metrics.service';
import { ChatSessionService } from './chat-session.service';
import { CreateChatbotConfigDto, UpdateChatbotConfigDto } from './dto/chatbot-config.dto';

@Controller('chatbot-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatbotConfigController {
  constructor(
    private readonly chatbotConfigService: ChatbotConfigService,
    private readonly chatMetricsService: ChatMetricsService,
    private readonly chatSessionService: ChatSessionService,
  ) {}

  /**
   * Get chatbot configuration for current tenant
   */
  @Get()
  @Roles('PROVIDER', 'STAFF_RECEPTIONIST', 'SUPER_ADMIN')
  async getConfig(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.chatbotConfigService.getConfig(tenantId);
  }

  /**
   * Get chatbot configuration for a specific tenant (Super Admin)
   */
  @Get('tenant/:tenantId')
  @Roles('SUPER_ADMIN')
  async getConfigByTenant(@Param('tenantId') tenantId: string) {
    return this.chatbotConfigService.getConfig(tenantId);
  }

  /**
   * Create or update chatbot configuration
   */
  @Post()
  @Roles('PROVIDER', 'SUPER_ADMIN')
  async createOrUpdateConfig(@Request() req: any, @Body() dto: CreateChatbotConfigDto) {
    const tenantId = req.user.tenantId;
    return this.chatbotConfigService.upsertConfig(tenantId, dto);
  }

  /**
   * Update chatbot configuration
   */
  @Put()
  @Roles('PROVIDER', 'SUPER_ADMIN')
  async updateConfig(@Request() req: any, @Body() dto: UpdateChatbotConfigDto) {
    const tenantId = req.user.tenantId;
    return this.chatbotConfigService.upsertConfig(tenantId, dto);
  }

  /**
   * Update chatbot configuration for a specific tenant (Super Admin)
   */
  @Put('tenant/:tenantId')
  @Roles('SUPER_ADMIN')
  async updateConfigByTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateChatbotConfigDto,
  ) {
    return this.chatbotConfigService.upsertConfig(tenantId, dto);
  }

  /**
   * Delete chatbot configuration
   */
  @Delete()
  @Roles('PROVIDER', 'SUPER_ADMIN')
  async deleteConfig(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.chatbotConfigService.deleteConfig(tenantId);
  }

  /**
   * Get chatbot metrics/analytics
   */
  @Get('metrics')
  @Roles('PROVIDER', 'SUPER_ADMIN')
  async getMetrics(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.chatMetricsService.getMetrics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get active chat sessions (for human handoff dashboard)
   */
  @Get('sessions')
  @Roles('PROVIDER', 'STAFF_RECEPTIONIST', 'SUPER_ADMIN')
  async getActiveSessions(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.chatSessionService.getActiveSessions(tenantId);
  }

  /**
   * Test chatbot response
   */
  @Post('test')
  @Roles('PROVIDER', 'SUPER_ADMIN')
  async testChatbot(@Request() req: any, @Body() body: { message: string }) {
    const tenantId = req.user.tenantId;
    const config = await this.chatbotConfigService.getConfig(tenantId);

    return {
      config: {
        isEnabled: config.isEnabled,
        practiceName: config.practiceName,
        aiModel: config.aiModel,
      },
      testMessage: body.message,
      systemPrompt: await this.chatbotConfigService.getSystemPrompt(tenantId),
    };
  }
}
