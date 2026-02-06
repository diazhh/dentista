import { Injectable, Logger } from '@nestjs/common';
import { AIAgentEngine } from './ai-agent.engine';
import { ChatSessionService, ChatChannel } from './chat-session.service';
import { ChatbotConfigService } from './chatbot-config.service';

// Re-export ChatChannel so consumers can import from this module
export { ChatChannel } from './chat-session.service';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface IncomingMessage {
  channel: ChatChannel;
  senderId: string; // phone number for WA/SMS, socket session for webchat
  tenantId: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface OutgoingMessage {
  channel: ChatChannel;
  recipientId: string;
  tenantId: string;
  text: string;
  actions?: ChatAction[];
  metadata?: Record<string, any>;
}

export interface ChatAction {
  type: 'quick_reply' | 'button' | 'link';
  label: string;
  value: string;
}

// ------------------------------------------------------------------
// Service
// ------------------------------------------------------------------

@Injectable()
export class MessageRouterService {
  private readonly logger = new Logger(MessageRouterService.name);

  constructor(
    private readonly aiAgent: AIAgentEngine,
    private readonly sessionService: ChatSessionService,
    private readonly chatbotConfigService: ChatbotConfigService,
  ) {}

  // ==================================================================
  // Main entry point
  // ==================================================================

  /**
   * Route an incoming message through the AI pipeline and return a response.
   *
   * Flow:
   * 1. Get or create chat session
   * 2. Check human-handoff mode
   * 3. Check human-handoff keywords
   * 4. Delegate to AIAgentEngine
   * 5. Log conversation
   * 6. Return formatted OutgoingMessage
   */
  async processMessage(incoming: IncomingMessage): Promise<OutgoingMessage> {
    const { channel, senderId, tenantId, message } = incoming;

    // 1. Retrieve (or create) the session
    const session = this.sessionService.getOrCreateSession(
      channel,
      senderId,
      tenantId,
    );

    // Log the user message
    this.sessionService.addMessage(session.id, 'user', message);

    // 2. If the session is in human-handoff mode, skip the AI entirely
    if (session.isHumanHandoff) {
      this.logger.debug(
        `Session ${session.id} is in human-handoff mode -- forwarding to staff`,
      );

      return this.buildOutgoing(
        incoming,
        'Tu mensaje ha sido enviado a nuestro equipo. En breve te responderan.',
        [
          {
            type: 'quick_reply',
            label: 'Volver al asistente',
            value: 'volver_asistente',
          },
        ],
      );
    }

    // 3. Check if the user is requesting a human handoff
    const config = await this.chatbotConfigService.getConfig(tenantId);
    const handoffKeywords: string[] = config.humanHandoffKeywords || [];
    const normalised = message.toLowerCase().trim();

    if (handoffKeywords.some((kw: string) => normalised.includes(kw))) {
      this.initiateHumanHandoff(session.id);

      const handoffText =
        'Entiendo, te transferire con un miembro de nuestro equipo. En un momento te atendera alguien.';
      this.sessionService.addMessage(session.id, 'assistant', handoffText);

      return this.buildOutgoing(incoming, handoffText);
    }

    // Handle "return to assistant" special command
    if (
      normalised === 'volver_asistente' ||
      normalised === 'volver al asistente'
    ) {
      this.endHumanHandoff(session.id);

      const returnText =
        'Has vuelto al asistente virtual. En que puedo ayudarte?';
      this.sessionService.addMessage(session.id, 'assistant', returnText);

      return this.buildOutgoing(incoming, returnText);
    }

    // 4. Delegate to the AI agent engine
    const agentResponse = await this.aiAgent.process(
      session.id,
      tenantId,
      message,
      session.patientId,
    );

    // Update session with intent and any patient identification
    this.sessionService.updateSession(session.id, {
      lastIntent: agentResponse.intent,
    });

    // If the agent identified a patient via a tool call, persist in session
    if (agentResponse.actions) {
      for (const action of agentResponse.actions) {
        if (
          action.function === 'identify_patient' &&
          action.result?.found
        ) {
          this.sessionService.updateSession(session.id, {
            patientId: action.result.patientId,
            patientName: action.result.patientName,
          });
        }
      }
    }

    // 5. Log the assistant response
    this.sessionService.addMessage(session.id, 'assistant', agentResponse.text);

    // 6. Build and return the outgoing message
    const outgoingActions = this.buildQuickReplies(agentResponse.intent);

    return this.buildOutgoing(
      incoming,
      agentResponse.text,
      outgoingActions,
      agentResponse.metadata,
    );
  }

  // ==================================================================
  // Human handoff management
  // ==================================================================

  /**
   * Mark a session for human handling.  Messages will be forwarded to staff
   * instead of the AI agent.
   */
  initiateHumanHandoff(sessionId: string, staffId?: string): void {
    this.sessionService.updateSession(sessionId, {
      isHumanHandoff: true,
      handoffStaffId: staffId,
    });
    this.sessionService.addMessage(
      sessionId,
      'system',
      'Human handoff initiated.',
    );
    this.logger.log(`Human handoff initiated for session ${sessionId}`);
  }

  /**
   * Return a session to AI mode after a human handoff period.
   */
  endHumanHandoff(sessionId: string): void {
    this.sessionService.updateSession(sessionId, {
      isHumanHandoff: false,
      handoffStaffId: undefined,
    });
    this.sessionService.addMessage(
      sessionId,
      'system',
      'Human handoff ended -- returning to AI.',
    );
    this.logger.log(`Human handoff ended for session ${sessionId}`);
  }

  // ==================================================================
  // Helpers
  // ==================================================================

  private buildOutgoing(
    incoming: IncomingMessage,
    text: string,
    actions?: ChatAction[],
    metadata?: Record<string, any>,
  ): OutgoingMessage {
    return {
      channel: incoming.channel,
      recipientId: incoming.senderId,
      tenantId: incoming.tenantId,
      text,
      actions,
      metadata,
    };
  }

  /**
   * Provide suggested quick-reply buttons based on the detected intent to
   * improve the conversational UX (mainly for webchat; WhatsApp/SMS channels
   * may ignore these depending on their adapter).
   */
  private buildQuickReplies(intent: string): ChatAction[] | undefined {
    switch (intent) {
      case 'GREETING':
      case 'UNKNOWN':
        return [
          { type: 'quick_reply', label: 'Agendar cita', value: 'agendar cita' },
          { type: 'quick_reply', label: 'Ver horarios', value: 'horarios' },
          { type: 'quick_reply', label: 'Servicios', value: 'servicios' },
          { type: 'quick_reply', label: 'Hablar con alguien', value: 'humano' },
        ];

      case 'CHECK_AVAILABILITY':
      case 'SCHEDULE_APPOINTMENT':
        return [
          { type: 'quick_reply', label: 'Manana', value: 'disponibilidad manana' },
          { type: 'quick_reply', label: 'Esta semana', value: 'disponibilidad esta semana' },
          { type: 'quick_reply', label: 'Otra fecha', value: 'disponibilidad otra fecha' },
        ];

      case 'ASK_SERVICES':
      case 'ASK_PRICES':
        return [
          { type: 'quick_reply', label: 'Agendar cita', value: 'agendar cita' },
          { type: 'quick_reply', label: 'Mas info', value: 'mas informacion' },
        ];

      case 'HUMAN_HANDOFF':
        return [
          { type: 'quick_reply', label: 'Volver al asistente', value: 'volver_asistente' },
        ];

      default:
        return undefined;
    }
  }
}
