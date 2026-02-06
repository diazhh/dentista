import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ChatChannel = 'whatsapp' | 'webchat' | 'sms';

interface ConversationLog {
  id: string;
  tenantId: string;
  channel: ChatChannel;
  sessionId: string;
  patientId?: string;
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
  intents: string[];
  appointmentBooked: boolean;
  humanHandoff: boolean;
  satisfaction?: number;
}

export interface ConversationMetrics {
  totalConversations: number;
  appointmentsBooked: number;
  bookingRate: number;
  humanHandoffs: number;
  handoffRate: number;
  avgMessagesPerConversation: number;
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
  channelBreakdown: Array<{ channel: string; count: number; percentage: number }>;
  avgResponseTime?: number;
}

/**
 * ChatMetricsService tracks chatbot conversation analytics in memory.
 *
 * NOTE: This implementation uses an in-memory Map for conversation tracking.
 * In production, this should be backed by a dedicated ChatConversation database
 * table (or a time-series database) for persistence across restarts and
 * multi-instance deployments.
 */
@Injectable()
export class ChatMetricsService {
  private readonly logger = new Logger(ChatMetricsService.name);

  /**
   * In-memory store for conversation logs, keyed by sessionId.
   * This data is lost on server restart -- a DB-backed implementation
   * should replace this for production use.
   */
  private conversations = new Map<string, ConversationLog>();

  /** Auto-increment counter for generating conversation IDs */
  private idCounter = 0;

  constructor(private prisma: PrismaService) {}

  /**
   * Start tracking a new conversation.
   * Called when a user sends their first message in a session.
   */
  logConversationStart(tenantId: string, channel: ChatChannel, sessionId: string): string {
    if (this.conversations.has(sessionId)) {
      this.logger.debug(`Conversation ${sessionId} already tracked, skipping start`);
      return sessionId;
    }

    this.idCounter++;
    const conversationId = `conv_${this.idCounter}_${Date.now()}`;

    const log: ConversationLog = {
      id: conversationId,
      tenantId,
      channel,
      sessionId,
      startedAt: new Date(),
      messageCount: 0,
      intents: [],
      appointmentBooked: false,
      humanHandoff: false,
    };

    this.conversations.set(sessionId, log);
    this.logger.debug(`Conversation started: ${sessionId} [${channel}] for tenant ${tenantId}`);

    return conversationId;
  }

  /**
   * Log a message within an active conversation.
   * Increments message count and tracks the detected intent.
   */
  logMessage(sessionId: string, intent?: string): void {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      this.logger.warn(`Cannot log message: conversation ${sessionId} not found`);
      return;
    }

    conversation.messageCount++;

    if (intent && !conversation.intents.includes(intent)) {
      conversation.intents.push(intent);
    }
  }

  /**
   * Finalize a conversation when it ends.
   * Records whether an appointment was booked or a human handoff occurred.
   */
  logConversationEnd(
    sessionId: string,
    appointmentBooked: boolean,
    humanHandoff: boolean,
  ): void {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      this.logger.warn(`Cannot end conversation: session ${sessionId} not found`);
      return;
    }

    conversation.endedAt = new Date();
    conversation.appointmentBooked = appointmentBooked;
    conversation.humanHandoff = humanHandoff;

    this.logger.debug(
      `Conversation ended: ${sessionId} ` +
        `(messages: ${conversation.messageCount}, ` +
        `booked: ${appointmentBooked}, handoff: ${humanHandoff})`,
    );
  }

  /**
   * Set the patient ID for a conversation once the patient is identified.
   */
  setPatientId(sessionId: string, patientId: string): void {
    const conversation = this.conversations.get(sessionId);
    if (conversation) {
      conversation.patientId = patientId;
    }
  }

  /**
   * Record a satisfaction score for a completed conversation.
   */
  setSatisfaction(sessionId: string, score: number): void {
    const conversation = this.conversations.get(sessionId);
    if (conversation) {
      conversation.satisfaction = Math.min(5, Math.max(1, score));
    }
  }

  /**
   * Get aggregated metrics for a tenant within an optional date range.
   */
  getMetrics(tenantId: string, startDate?: Date, endDate?: Date): ConversationMetrics {
    const filtered = this.getFilteredConversations(tenantId, startDate, endDate);

    const totalConversations = filtered.length;

    if (totalConversations === 0) {
      return {
        totalConversations: 0,
        appointmentsBooked: 0,
        bookingRate: 0,
        humanHandoffs: 0,
        handoffRate: 0,
        avgMessagesPerConversation: 0,
        topIntents: [],
        channelBreakdown: [],
      };
    }

    const appointmentsBooked = filtered.filter((c) => c.appointmentBooked).length;
    const humanHandoffs = filtered.filter((c) => c.humanHandoff).length;
    const totalMessages = filtered.reduce((sum, c) => sum + c.messageCount, 0);

    // Aggregate intents
    const intentCounts = new Map<string, number>();
    for (const conversation of filtered) {
      for (const intent of conversation.intents) {
        intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
      }
    }

    const topIntents = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({
        intent,
        count,
        percentage: Math.round((count / totalConversations) * 10000) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate channels
    const channelCounts = new Map<string, number>();
    for (const conversation of filtered) {
      channelCounts.set(conversation.channel, (channelCounts.get(conversation.channel) || 0) + 1);
    }

    const channelBreakdown = Array.from(channelCounts.entries())
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: Math.round((count / totalConversations) * 10000) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate average response time for completed conversations
    const completedConversations = filtered.filter((c) => c.endedAt);
    let avgResponseTime: number | undefined;
    if (completedConversations.length > 0) {
      const totalDuration = completedConversations.reduce((sum, c) => {
        const duration = (c.endedAt!.getTime() - c.startedAt.getTime()) / 1000;
        return sum + duration;
      }, 0);
      avgResponseTime = Math.round(totalDuration / completedConversations.length);
    }

    return {
      totalConversations,
      appointmentsBooked,
      bookingRate: Math.round((appointmentsBooked / totalConversations) * 10000) / 100,
      humanHandoffs,
      handoffRate: Math.round((humanHandoffs / totalConversations) * 10000) / 100,
      avgMessagesPerConversation: Math.round((totalMessages / totalConversations) * 100) / 100,
      topIntents,
      channelBreakdown,
      avgResponseTime,
    };
  }

  /**
   * Get recent conversation logs for a tenant.
   * Returns the most recent conversations, sorted by start time descending.
   */
  getRecentConversations(tenantId: string, limit = 20): ConversationLog[] {
    const tenantConversations: ConversationLog[] = [];

    for (const conversation of this.conversations.values()) {
      if (conversation.tenantId === tenantId) {
        tenantConversations.push(conversation);
      }
    }

    return tenantConversations
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Filter conversations by tenant and optional date range.
   */
  private getFilteredConversations(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): ConversationLog[] {
    const result: ConversationLog[] = [];

    for (const conversation of this.conversations.values()) {
      if (conversation.tenantId !== tenantId) {
        continue;
      }

      if (startDate && conversation.startedAt < startDate) {
        continue;
      }

      if (endDate && conversation.startedAt > endDate) {
        continue;
      }

      result.push(conversation);
    }

    return result;
  }

  /**
   * Clean up old conversations from memory to prevent unbounded growth.
   * Should be called periodically (e.g., via a cron job).
   * In production, this data should be persisted to the database
   * before cleanup.
   */
  cleanupOldConversations(maxAgeDays = 7): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAgeDays);

    let removedCount = 0;

    for (const [sessionId, conversation] of this.conversations.entries()) {
      if (conversation.startedAt < cutoff) {
        this.conversations.delete(sessionId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} old conversation logs`);
    }

    return removedCount;
  }
}
