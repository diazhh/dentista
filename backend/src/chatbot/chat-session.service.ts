import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type ChatChannel = 'whatsapp' | 'webchat' | 'sms';

export interface ChatSession {
  id: string;
  tenantId: string;
  channel: ChatChannel;
  senderId: string;
  patientId?: string;
  patientName?: string;
  lastIntent?: string;
  awaitingInput?: string;
  isHumanHandoff: boolean;
  handoffStaffId?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  lastActivityAt: Date;
  metadata?: Record<string, any>;
}

/**
 * In-memory chat session manager.
 *
 * NOTE: In production this should be backed by Redis (or another distributed
 * store) so that sessions survive server restarts and are shared across
 * multiple instances.  The in-memory Map used here is intentional for the
 * MVP / single-instance deployment stage.
 */
@Injectable()
export class ChatSessionService {
  private readonly logger = new Logger(ChatSessionService.name);

  // sessionId -> ChatSession
  private sessions = new Map<string, ChatSession>();

  // Composite key (channel:senderId:tenantId) -> sessionId for fast lookup
  private senderIndex = new Map<string, string>();

  /** How long a session can be idle before it is considered expired. */
  private readonly SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Return an existing active session for the given sender or create a new one.
   * Expired sessions are cleaned up transparently.
   */
  getOrCreateSession(
    channel: ChatChannel,
    senderId: string,
    tenantId: string,
  ): ChatSession {
    const key = this.compositeKey(channel, senderId, tenantId);
    const existingId = this.senderIndex.get(key);

    if (existingId) {
      const session = this.sessions.get(existingId);
      if (session && !this.isExpired(session)) {
        session.lastActivityAt = new Date();
        return session;
      }
      // Expired or missing -- clean up stale references
      this.removeSessionRefs(existingId, key);
    }

    // Create a brand-new session
    const session: ChatSession = {
      id: randomUUID(),
      tenantId,
      channel,
      senderId,
      isHumanHandoff: false,
      conversationHistory: [],
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.sessions.set(session.id, session);
    this.senderIndex.set(key, session.id);

    this.logger.debug(
      `New chat session created: ${session.id} (${channel}/${senderId})`,
    );

    return session;
  }

  /**
   * Retrieve a session by its ID.  Returns `undefined` when the session does
   * not exist or has expired.
   */
  getSession(sessionId: string): ChatSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (this.isExpired(session)) {
      this.removeSessionById(sessionId);
      return undefined;
    }

    return session;
  }

  /**
   * Apply a partial update to an existing session.
   */
  updateSession(
    sessionId: string,
    updates: Partial<Omit<ChatSession, 'id' | 'createdAt'>>,
  ): ChatSession | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    Object.assign(session, updates, { lastActivityAt: new Date() });
    return session;
  }

  /**
   * Append a message to the conversation history of a session.
   */
  addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });
    session.lastActivityAt = new Date();
  }

  /**
   * Permanently remove a session.
   */
  endSession(sessionId: string): void {
    this.removeSessionById(sessionId);
    this.logger.debug(`Chat session ended: ${sessionId}`);
  }

  /**
   * List all active (non-expired) sessions for a given tenant.
   * Useful for a human-handoff dashboard.
   */
  getActiveSessions(tenantId: string): ChatSession[] {
    const results: ChatSession[] = [];
    const expiredIds: string[] = [];

    for (const [id, session] of this.sessions) {
      if (session.tenantId !== tenantId) continue;

      if (this.isExpired(session)) {
        expiredIds.push(id);
        continue;
      }

      results.push(session);
    }

    // Lazy cleanup of expired sessions discovered during iteration
    for (const id of expiredIds) {
      this.removeSessionById(id);
    }

    return results;
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private compositeKey(
    channel: ChatChannel,
    senderId: string,
    tenantId: string,
  ): string {
    return `${channel}:${senderId}:${tenantId}`;
  }

  private isExpired(session: ChatSession): boolean {
    return Date.now() - session.lastActivityAt.getTime() > this.SESSION_TTL_MS;
  }

  private removeSessionById(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const key = this.compositeKey(
        session.channel,
        session.senderId,
        session.tenantId,
      );
      this.senderIndex.delete(key);
    }
    this.sessions.delete(sessionId);
  }

  private removeSessionRefs(sessionId: string, senderKey: string): void {
    this.sessions.delete(sessionId);
    this.senderIndex.delete(senderKey);
  }
}
