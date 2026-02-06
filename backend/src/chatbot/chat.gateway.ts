import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessageRouterService, IncomingMessage, ChatAction } from './message-router.service';

interface ConnectedClient {
  socketId: string;
  tenantId: string;
  sessionId?: string;
  connectedAt: Date;
}

interface WebchatMessagePayload {
  tenantId: string;
  message: string;
  sessionId?: string;
}

interface WebchatResponse {
  message: string;
  actions?: ChatAction[];
  sessionId: string;
  metadata?: Record<string, unknown>;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  /**
   * Track connected clients by socket ID.
   * In production, consider using Redis for multi-instance support.
   */
  private connectedClients = new Map<string, ConnectedClient>();

  constructor(private messageRouter: MessageRouterService) {}

  /**
   * Handle new WebSocket connections.
   * Extracts tenantId from handshake query params and optional auth token.
   */
  handleConnection(client: Socket): void {
    const tenantId = client.handshake.query.tenantId as string;
    const token = client.handshake.auth?.token as string | undefined;

    if (!tenantId) {
      this.logger.warn(`Client ${client.id} connected without tenantId - disconnecting`);
      client.emit('error', { message: 'tenantId is required' });
      client.disconnect();
      return;
    }

    const clientInfo: ConnectedClient = {
      socketId: client.id,
      tenantId,
      connectedAt: new Date(),
    };

    this.connectedClients.set(client.id, clientInfo);

    // Join tenant-specific room for broadcasts
    client.join(`tenant:${tenantId}`);

    this.logger.log(
      `Client ${client.id} connected for tenant ${tenantId}` +
        (token ? ' (authenticated)' : ' (anonymous)'),
    );

    // Send connection acknowledgment
    client.emit('connected', {
      socketId: client.id,
      tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle client disconnections.
   * Cleans up client tracking but does not end the session
   * to allow reconnection within a reasonable window.
   */
  handleDisconnect(client: Socket): void {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo) {
      this.logger.log(
        `Client ${client.id} disconnected from tenant ${clientInfo.tenantId}` +
          (clientInfo.sessionId ? ` (session: ${clientInfo.sessionId})` : ''),
      );
      this.connectedClients.delete(client.id);
    } else {
      this.logger.log(`Unknown client ${client.id} disconnected`);
    }
  }

  /**
   * Handle incoming chat messages from the web widget.
   * Emits a typing indicator, processes through MessageRouter,
   * and returns the AI response with optional actions.
   */
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() payload: WebchatMessagePayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { tenantId, message, sessionId } = payload;

    if (!tenantId || !message) {
      client.emit('error', { message: 'tenantId and message are required' });
      return;
    }

    this.logger.debug(`Message from ${client.id} [tenant: ${tenantId}]: ${message}`);

    // Emit typing indicator so the widget can show "typing..."
    client.emit('typing', { isTyping: true });

    try {
      // Build the incoming message for the router
      const incomingMessage: IncomingMessage = {
        channel: 'webchat',
        tenantId,
        senderId: client.id,
        message,
        metadata: {
          socketId: client.id,
          sessionId,
          connectedAt: this.connectedClients.get(client.id)?.connectedAt?.toISOString(),
        },
      };

      // Process through the message router
      const result = await this.messageRouter.processMessage(incomingMessage);

      // Update session tracking for the client
      const clientInfo = this.connectedClients.get(client.id);
      const resultSessionId = result.metadata?.sessionId as string | undefined;
      if (clientInfo && resultSessionId) {
        clientInfo.sessionId = resultSessionId;
      }

      // Stop typing indicator and send response
      client.emit('typing', { isTyping: false });

      const response: WebchatResponse = {
        message: result.text,
        actions: result.actions,
        sessionId: resultSessionId || sessionId || '',
        metadata: result.metadata,
      };

      client.emit('response', response);
    } catch (error) {
      this.logger.error(`Error processing message from ${client.id}: ${error.message}`, error.stack);

      client.emit('typing', { isTyping: false });
      client.emit('response', {
        message: 'Lo sentimos, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
        sessionId: sessionId || '',
      });
    }
  }

  /**
   * Handle explicit session end requests from the client.
   * Finalizes the conversation and emits confirmation.
   */
  @SubscribeMessage('end_session')
  async handleEndSession(
    @MessageBody() payload: { sessionId?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.connectedClients.get(client.id);
    const sessionId = payload?.sessionId || clientInfo?.sessionId;

    if (sessionId) {
      this.logger.log(`Session ${sessionId} ended by client ${client.id}`);

      // Clear session from client tracking
      if (clientInfo) {
        clientInfo.sessionId = undefined;
      }
    }

    client.emit('session-end', {
      sessionId,
      endedAt: new Date().toISOString(),
      message: 'Sesion finalizada. Gracias por comunicarte con nosotros.',
    });
  }

  /**
   * Broadcast a human handoff notification to connected staff members.
   * Staff clients should join the 'staff' room upon authentication.
   */
  notifyHumanHandoff(tenantId: string, sessionId: string, message: string): void {
    this.logger.log(`Human handoff requested for session ${sessionId} in tenant ${tenantId}`);

    this.server.to(`staff:${tenantId}`).emit('human-handoff', {
      tenantId,
      sessionId,
      message,
      requestedAt: new Date().toISOString(),
    });
  }

  /**
   * Allow staff clients to join the staff notification room.
   * Called when a staff member authenticates via the socket.
   */
  @SubscribeMessage('join_staff')
  handleJoinStaff(
    @MessageBody() payload: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { tenantId } = payload;

    if (!tenantId) {
      client.emit('error', { message: 'tenantId is required to join staff room' });
      return;
    }

    client.join(`staff:${tenantId}`);
    this.logger.log(`Client ${client.id} joined staff room for tenant ${tenantId}`);

    client.emit('staff-joined', {
      tenantId,
      joinedAt: new Date().toISOString(),
    });
  }

  /**
   * Get the number of currently connected clients for a tenant.
   * Useful for dashboard metrics.
   */
  getConnectedClientCount(tenantId: string): number {
    let count = 0;
    for (const client of this.connectedClients.values()) {
      if (client.tenantId === tenantId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Send a message to a specific client by socket ID.
   * Used by other services to push notifications to the web widget.
   */
  sendToClient(socketId: string, event: string, data: unknown): void {
    this.server.to(socketId).emit(event, data);
  }
}
