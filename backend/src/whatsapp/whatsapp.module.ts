import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
    imports: [forwardRef(() => ChatbotModule)],
    providers: [WhatsappService],
    controllers: [WhatsappController],
    exports: [WhatsappService],
})
export class WhatsappModule { }
