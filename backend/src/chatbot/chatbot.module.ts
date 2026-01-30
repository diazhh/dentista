import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotConfigService } from './chatbot-config.service';
import { ChatbotConfigController } from './chatbot-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotConfigController],
  providers: [ChatbotService, ChatbotConfigService],
  exports: [ChatbotService, ChatbotConfigService],
})
export class ChatbotModule {}
