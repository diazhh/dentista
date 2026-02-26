import { ChatSessionService, ChatSession } from './chat-session.service';

/**
 * Mock Redis with a Map-based in-memory store.
 */
class MockRedis {
  private store = new Map<string, any>();
  private sets = new Map<string, Set<string>>();
  private hashStore = new Map<string, Record<string, string>>();
  private expiries = new Map<string, number>();

  async connect() { return; }
  async quit() { return; }

  async get(key: string): Promise<string | null> {
    const val = this.store.get(key);
    if (val === undefined) return null;
    // Check expiry
    const exp = this.expiries.get(key);
    if (exp && Date.now() > exp) {
      this.store.delete(key);
      this.expiries.delete(key);
      return null;
    }
    return val;
  }

  async set(key: string, value: string, ...args: any[]) {
    this.store.set(key, value);
    if (args[0] === 'EX' && args[1]) {
      this.expiries.set(key, Date.now() + args[1] * 1000);
    }
    return 'OK';
  }

  async del(key: string) {
    this.store.delete(key);
    this.hashStore.delete(key);
    return 1;
  }

  async hset(key: string, hash: Record<string, string>) {
    this.hashStore.set(key, { ...hash });
    return Object.keys(hash).length;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.hashStore.get(key) || {};
  }

  async expire(key: string, seconds: number) {
    this.expiries.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  async sadd(key: string, ...members: string[]) {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    members.forEach(m => this.sets.get(key)!.add(m));
    return members.length;
  }

  async srem(key: string, ...members: string[]) {
    const set = this.sets.get(key);
    if (!set) return 0;
    members.forEach(m => set.delete(m));
    return members.length;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  pipeline() {
    const ops: Array<() => Promise<any>> = [];
    const self = this;
    return {
      del(key: string) { ops.push(() => self.del(key)); return this; },
      hset(key: string, hash: Record<string, string>) { ops.push(() => self.hset(key, hash)); return this; },
      expire(key: string, seconds: number) { ops.push(() => self.expire(key, seconds)); return this; },
      async exec() {
        const results = [];
        for (const op of ops) {
          results.push([null, await op()]);
        }
        return results;
      },
    };
  }
}

describe('ChatSessionService', () => {
  let service: ChatSessionService;
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockRedis = new MockRedis();

    // Create service and inject mock redis
    service = new ChatSessionService();
    (service as any).redis = mockRedis;
  });

  afterEach(async () => {
    // Don't call onModuleDestroy since we're mocking redis
  });

  describe('getOrCreateSession', () => {
    it('should create a new session when none exists', async () => {
      const session = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.channel).toBe('webchat');
      expect(session.senderId).toBe('sender-001');
      expect(session.tenantId).toBe('tenant-001');
      expect(session.isHumanHandoff).toBe(false);
      expect(session.conversationHistory).toEqual([]);
    });

    it('should return existing session for same channel/sender/tenant', async () => {
      const session1 = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');
      const session2 = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');

      expect(session1.id).toBe(session2.id);
    });

    it('should create different sessions for different tenants', async () => {
      const session1 = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');
      const session2 = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-002');

      expect(session1.id).not.toBe(session2.id);
    });

    it('should create different sessions for different channels', async () => {
      const session1 = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');
      const session2 = await service.getOrCreateSession('whatsapp', 'sender-001', 'tenant-001');

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('getSession', () => {
    it('should return existing session by ID', async () => {
      const created = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');

      const fetched = await service.getSession(created.id);

      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.tenantId).toBe('tenant-001');
    });

    it('should return undefined for non-existent session', async () => {
      const result = await service.getSession('nonexistent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('addMessage', () => {
    it('should add message to session conversation history', async () => {
      const session = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');

      await service.addMessage(session.id, 'user', 'Hello!');
      await service.addMessage(session.id, 'assistant', 'Hi, how can I help?');

      const updated = await service.getSession(session.id);
      expect(updated!.conversationHistory).toHaveLength(2);
      expect(updated!.conversationHistory[0].role).toBe('user');
      expect(updated!.conversationHistory[0].content).toBe('Hello!');
      expect(updated!.conversationHistory[1].role).toBe('assistant');
    });

    it('should not fail when session does not exist', async () => {
      // Should silently do nothing
      await expect(
        service.addMessage('nonexistent', 'user', 'Hello'),
      ).resolves.toBeUndefined();
    });
  });

  describe('updateSession', () => {
    it('should update session metadata', async () => {
      const session = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');

      const updated = await service.updateSession(session.id, {
        patientId: 'patient-001',
        patientName: 'Jane Doe',
        lastIntent: 'SCHEDULE_APPOINTMENT',
      });

      expect(updated).toBeDefined();
      expect(updated!.patientId).toBe('patient-001');
      expect(updated!.patientName).toBe('Jane Doe');
      expect(updated!.lastIntent).toBe('SCHEDULE_APPOINTMENT');
    });

    it('should return undefined for non-existent session', async () => {
      const result = await service.updateSession('nonexistent', { patientName: 'test' });

      expect(result).toBeUndefined();
    });
  });

  describe('endSession', () => {
    it('should delete session from Redis', async () => {
      const session = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');
      expect(await service.getSession(session.id)).toBeDefined();

      await service.endSession(session.id);

      expect(await service.getSession(session.id)).toBeUndefined();
    });

    it('should clean up sender key and tenant set', async () => {
      const session = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');

      await service.endSession(session.id);

      // Creating a new session for the same sender should produce a new session
      const newSession = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');
      expect(newSession.id).not.toBe(session.id);
    });
  });

  describe('getActiveSessions', () => {
    it('should return all active sessions for a tenant', async () => {
      await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');
      await service.getOrCreateSession('webchat', 'sender-002', 'tenant-001');
      await service.getOrCreateSession('webchat', 'sender-003', 'tenant-002'); // different tenant

      const sessions = await service.getActiveSessions('tenant-001');

      expect(sessions).toHaveLength(2);
    });

    it('should return empty array when no sessions exist', async () => {
      const sessions = await service.getActiveSessions('empty-tenant');

      expect(sessions).toEqual([]);
    });

    it('should clean up stale session references', async () => {
      const session = await service.getOrCreateSession('webchat', 'sender-001', 'tenant-001');

      // Manually delete the session data (simulating TTL expiry)
      await mockRedis.del(`chat:session:${session.id}`);

      const sessions = await service.getActiveSessions('tenant-001');
      expect(sessions).toHaveLength(0);
    });
  });
});
