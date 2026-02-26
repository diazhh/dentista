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
    const key = `${SESSION_PREFIX}${session.id}`;
    const hash: Record<string, string> = {
      id: session.id,
      tenantId: session.tenantId,
      channel: session.channel,
      senderId: session.senderId,
      isHumanHandoff: String(session.isHumanHandoff),
      conversationHistory: JSON.stringify(session.conversationHistory),
      createdAt: session.createdAt.toISOString(),
      lastActivityAt: session.lastActivityAt.toISOString(),
    };

    if (session.patientId) hash.patientId = session.patientId;
    if (session.patientName) hash.patientName = session.patientName;
    if (session.lastIntent) hash.lastIntent = session.lastIntent;
    if (session.awaitingInput) hash.awaitingInput = session.awaitingInput;
    if (session.handoffStaffId) hash.handoffStaffId = session.handoffStaffId;
    if (session.metadata) hash.metadata = JSON.stringify(session.metadata);

    const pipeline = this.redis.pipeline();
    pipeline.del(key);
    pipeline.hset(key, hash);
    pipeline.expire(key, SESSION_TTL_SECONDS);
    await pipeline.exec();
  }

  private async loadSession(sessionId: string): Promise<ChatSession | undefined> {
    const data = await this.redis.hgetall(`${SESSION_PREFIX}${sessionId}`);
    if (!data || !data.id) return undefined;

    return {
      id: data.id,
      tenantId: data.tenantId,
      channel: data.channel as ChatChannel,
      senderId: data.senderId,
      patientId: data.patientId || undefined,
      patientName: data.patientName || undefined,
      lastIntent: data.lastIntent || undefined,
      awaitingInput: data.awaitingInput || undefined,
      isHumanHandoff: data.isHumanHandoff === 'true',
      handoffStaffId: data.handoffStaffId || undefined,
      conversationHistory: JSON.parse(data.conversationHistory || '[]').map(
        (m: any) => ({ ...m, timestamp: new Date(m.timestamp) }),
      ),
      createdAt: new Date(data.createdAt),
      lastActivityAt: new Date(data.lastActivityAt),
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
    };
  }
}
