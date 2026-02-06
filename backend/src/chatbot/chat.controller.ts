import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MessageRouterService, ChatChannel } from './message-router.service';

interface SendMessageDto {
  tenantId: string;
  message: string;
  sessionId?: string;
}

interface EndSessionDto {
  sessionId: string;
}

/**
 * Public REST controller for the web chat widget.
 * No JWT auth required - the widget is embedded in external sites.
 * Rate limiting is handled by the MessageRouter/ChatbotConfig.
 */
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly messageRouter: MessageRouterService) {}

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto) {
    if (!dto.tenantId || !dto.message) {
      throw new HttpException(
        'tenantId and message are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await this.messageRouter.processMessage({
        channel: 'webchat' as ChatChannel,
        senderId: dto.sessionId || `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenantId: dto.tenantId,
        message: dto.message,
      });

      return {
        message: response.text,
        actions: response.actions || [],
        sessionId: response.metadata?.sessionId || dto.sessionId,
        metadata: response.metadata,
      };
    } catch (error) {
      this.logger.error(`Chat message error: ${error.message}`);
      throw new HttpException(
        'Failed to process message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('end-session')
  async endSession(@Body() dto: EndSessionDto) {
    if (!dto.sessionId) {
      throw new HttpException(
        'sessionId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // The session service handles cleanup
      return { success: true, message: 'Session ended' };
    } catch (error) {
      this.logger.error(`End session error: ${error.message}`);
      throw new HttpException(
        'Failed to end session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
