import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ChatbotConfigService } from './chatbot-config.service';
import { CreateChatbotConfigDto, UpdateChatbotConfigDto } from './dto/chatbot-config.dto';

@Controller('chatbot-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatbotConfigController {
  constructor(private readonly chatbotConfigService: ChatbotConfigService) {}

  /**
   * Get chatbot configuration for current tenant
   */
  @Get()
  @Roles('DENTIST', 'STAFF_RECEPTIONIST', 'SUPER_ADMIN')
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
  @Roles('DENTIST', 'SUPER_ADMIN')
  async createOrUpdateConfig(@Request() req: any, @Body() dto: CreateChatbotConfigDto) {
    const tenantId = req.user.tenantId;
    return this.chatbotConfigService.upsertConfig(tenantId, dto);
  }

  /**
   * Update chatbot configuration
   */
  @Put()
  @Roles('DENTIST', 'SUPER_ADMIN')
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
  @Roles('DENTIST', 'SUPER_ADMIN')
  async deleteConfig(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.chatbotConfigService.deleteConfig(tenantId);
  }

  /**
   * Test chatbot response
   */
  @Post('test')
  @Roles('DENTIST', 'SUPER_ADMIN')
  async testChatbot(@Request() req: any, @Body() body: { message: string }) {
    const tenantId = req.user.tenantId;
    const config = await this.chatbotConfigService.getConfig(tenantId);

    return {
      config: {
        isEnabled: config.isEnabled,
        clinicName: config.clinicName,
        aiModel: config.aiModel,
      },
      testMessage: body.message,
      systemPrompt: await this.chatbotConfigService.getSystemPrompt(tenantId),
    };
  }
}
