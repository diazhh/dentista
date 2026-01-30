import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
