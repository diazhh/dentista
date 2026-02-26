import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { MessageRouterService, ChatChannel } from './message-router.service';
import { SendMessageDto, EndSessionDto } from './dto/chat-message.dto';

/**
 * Public REST controller for the web chat widget.
 * No JWT auth required - the widget is embedded in external sites.
 * Rate-limited to prevent abuse on public endpoints.
 */
@Controller('chat')
@UseGuards(ThrottlerGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly messageRouter: MessageRouterService) {}

  @Post('message')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async sendMessage(@Body() dto: SendMessageDto) {
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
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async endSession(@Body() dto: EndSessionDto) {
    return { success: true, message: 'Session ended' };
  }
}
