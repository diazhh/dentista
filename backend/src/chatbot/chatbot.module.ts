import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import { ChatbotConfigService } from './chatbot-config.service';
import { ChatbotConfigController } from './chatbot-config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIAgentEngine } from './ai-agent.engine';
import { MessageRouterService } from './message-router.service';
import { ChatSessionService } from './chat-session.service';
import { ChatMetricsService } from './chat-metrics.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [ChatbotConfigController],
  providers: [
    ChatbotService,
    ChatbotConfigService,
    AIAgentEngine,
    MessageRouterService,
    ChatSessionService,
    ChatMetricsService,
    ChatGateway,
  ],
  exports: [ChatbotService, ChatbotConfigService, MessageRouterService, AIAgentEngine],
})
export class ChatbotModule {}
