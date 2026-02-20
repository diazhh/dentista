import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

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

const SESSION_TTL_SECONDS = 30 * 60; // 30 minutes
const SESSION_PREFIX = 'chat:session:';
const SENDER_PREFIX = 'chat:sender:';
const TENANT_PREFIX = 'chat:tenant:';

@Injectable()
export class ChatSessionService implements OnModuleDestroy {
  private readonly logger = new Logger(ChatSessionService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6381', 10),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.connect().catch((err) => {
      this.logger.warn(`Redis connection failed, sessions will not persist: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async getOrCreateSession(
    channel: ChatChannel,
    senderId: string,
    tenantId: string,
  ): Promise<ChatSession> {
    const senderKey = this.compositeKey(channel, senderId, tenantId);
    const existingId = await this.redis.get(`${SENDER_PREFIX}${senderKey}`);

    if (existingId) {
      const session = await this.loadSession(existingId);
      if (session) {
        session.lastActivityAt = new Date();
        await this.saveSession(session);
        return session;
      }
      // Stale reference
      await this.redis.del(`${SENDER_PREFIX}${senderKey}`);
    }

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

    await this.saveSession(session);
    await this.redis.set(
      `${SENDER_PREFIX}${senderKey}`,
      session.id,
      'EX',
      SESSION_TTL_SECONDS,
    );
    await this.redis.sadd(`${TENANT_PREFIX}${tenantId}`, session.id);

    this.logger.debug(`New chat session created: ${session.id} (${channel}/${senderId})`);
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | undefined> {
    return this.loadSession(sessionId);
  }

  async updateSession(
    sessionId: string,
    updates: Partial<Omit<ChatSession, 'id' | 'createdAt'>>,
  ): Promise<ChatSession | undefined> {
    const session = await this.loadSession(sessionId);
    if (!session) return undefined;

    Object.assign(session, updates, { lastActivityAt: new Date() });
    await this.saveSession(session);
    return session;
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (!session) return;

    session.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });
    session.lastActivityAt = new Date();
    await this.saveSession(session);
  }

  async endSession(sessionId: string): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (session) {
      const senderKey = this.compositeKey(session.channel, session.senderId, session.tenantId);
      await this.redis.del(`${SENDER_PREFIX}${senderKey}`);
      await this.redis.srem(`${TENANT_PREFIX}${session.tenantId}`, sessionId);
    }
    await this.redis.del(`${SESSION_PREFIX}${sessionId}`);
    this.logger.debug(`Chat session ended: ${sessionId}`);
  }

  async getActiveSessions(tenantId: string): Promise<ChatSession[]> {
    const sessionIds = await this.redis.smembers(`${TENANT_PREFIX}${tenantId}`);
    const results: ChatSession[] = [];
    const staleIds: string[] = [];

    for (const id of sessionIds) {
      const session = await this.loadSession(id);
      if (session) {
        results.push(session);
      } else {
        staleIds.push(id);
      }
    }

    if (staleIds.length > 0) {
      await this.redis.srem(`${TENANT_PREFIX}${tenantId}`, ...staleIds);
    }

    return results;
  }

  private compositeKey(channel: ChatChannel, senderId: string, tenantId: string): string {
    return `${channel}:${senderId}:${tenantId}`;
  }

  private async saveSession(session: ChatSession): Promise<void> {
    const json = JSON.stringify(session);
    await this.redis.set(
      `${SESSION_PREFIX}${session.id}`,
      json,
      'EX',
      SESSION_TTL_SECONDS,
    );
  }

  private async loadSession(sessionId: string): Promise<ChatSession | undefined> {
    const json = await this.redis.get(`${SESSION_PREFIX}${sessionId}`);
    if (!json) return undefined;

    const data = JSON.parse(json);
    data.createdAt = new Date(data.createdAt);
    data.lastActivityAt = new Date(data.lastActivityAt);
    if (data.conversationHistory) {
      data.conversationHistory = data.conversationHistory.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    }
    return data as ChatSession;
  }
}
