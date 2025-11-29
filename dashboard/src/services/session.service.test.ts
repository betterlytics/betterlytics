import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateSessionToken,
  isSessionExpired,
} from './session.service';

// Mock the prisma client
vi.mock('@/lib/postgres', () => {
  const mockSession = {
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  };

  return {
    default: {
      session: mockSession,
    },
  };
});

// Import after mocking
import prisma from '@/lib/postgres';
import {
  createSession,
  findSessionByToken,
  deleteSession,
  deleteAllUserSessions,
  extendSession,
  cleanupExpiredSessions,
  getUserActiveSessions,
  countUserActiveSessions,
} from './session.service';

describe('Session Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSessionToken', () => {
    it('generates a 64-character hex string', () => {
      const token = generateSessionToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('generates unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSessionToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('isSessionExpired', () => {
    it('returns true for expired sessions', () => {
      const expiredSession = {
        expires: new Date(Date.now() - 1000), // 1 second ago
      };
      expect(isSessionExpired(expiredSession)).toBe(true);
    });

    it('returns false for valid sessions', () => {
      const validSession = {
        expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      };
      expect(isSessionExpired(validSession)).toBe(false);
    });

    it('returns true for sessions expiring exactly now', () => {
      const edgeSession = {
        expires: new Date(Date.now() - 1), // Just expired
      };
      expect(isSessionExpired(edgeSession)).toBe(true);
    });
  });

  describe('createSession', () => {
    it('creates a session with correct data', async () => {
      const userId = 'user-123';
      const mockCreatedSession = {
        id: 'session-id',
        sessionToken: 'mock-token',
        userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.session.create).mockResolvedValue(mockCreatedSession);

      const result = await createSession({ userId });

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          sessionToken: expect.any(String),
          expires: expect.any(Date),
        }),
      });
      expect(result.userId).toBe(userId);
      expect(result.sessionToken).toBe('mock-token');
    });

    it('respects custom maxAge', async () => {
      const userId = 'user-123';
      const customMaxAge = 60 * 60; // 1 hour in seconds
      const mockCreatedSession = {
        id: 'session-id',
        sessionToken: 'mock-token',
        userId,
        expires: new Date(Date.now() + customMaxAge * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.session.create).mockResolvedValue(mockCreatedSession);

      await createSession({ userId, maxAge: customMaxAge });

      const createCall = vi.mocked(prisma.session.create).mock.calls[0][0];
      const expiresDate = createCall.data.expires as Date;
      const expectedExpiry = Date.now() + customMaxAge * 1000;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(expiresDate.getTime() - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe('findSessionByToken', () => {
    it('returns session data when found', async () => {
      const mockSession = {
        id: 'session-id',
        sessionToken: 'test-token',
        userId: 'user-123',
        expires: new Date(Date.now() + 1000000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

      const result = await findSessionByToken('test-token');

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { sessionToken: 'test-token' },
      });
      expect(result).toEqual({
        id: 'session-id',
        sessionToken: 'test-token',
        userId: 'user-123',
        expires: mockSession.expires,
      });
    });

    it('returns null when session not found', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const result = await findSessionByToken('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('deletes session by token', async () => {
      vi.mocked(prisma.session.delete).mockResolvedValue({} as never);

      await deleteSession('test-token');

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken: 'test-token' },
      });
    });

    it('handles deletion of non-existent session gracefully', async () => {
      vi.mocked(prisma.session.delete).mockRejectedValue(new Error('Not found'));

      // Should not throw
      await expect(deleteSession('non-existent')).resolves.not.toThrow();
    });
  });

  describe('deleteAllUserSessions', () => {
    it('deletes all sessions for a user', async () => {
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 5 });

      const result = await deleteAllUserSessions('user-123');

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      expect(result).toBe(5);
    });

    it('returns 0 when user has no sessions', async () => {
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 0 });

      const result = await deleteAllUserSessions('user-no-sessions');

      expect(result).toBe(0);
    });
  });

  describe('extendSession', () => {
    it('extends session expiry', async () => {
      const mockUpdatedSession = {
        id: 'session-id',
        sessionToken: 'test-token',
        userId: 'user-123',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.session.update).mockResolvedValue(mockUpdatedSession);

      const result = await extendSession('test-token');

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { sessionToken: 'test-token' },
        data: { expires: expect.any(Date) },
      });
      expect(result).not.toBeNull();
      expect(result?.sessionToken).toBe('test-token');
    });

    it('returns null when session not found', async () => {
      vi.mocked(prisma.session.update).mockRejectedValue(new Error('Not found'));

      const result = await extendSession('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('deletes expired sessions', async () => {
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 10 });

      const result = await cleanupExpiredSessions();

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: {
            lt: expect.any(Date),
          },
        },
      });
      expect(result).toBe(10);
    });
  });

  describe('getUserActiveSessions', () => {
    it('returns active sessions for a user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          sessionToken: 'token-1',
          userId: 'user-123',
          expires: new Date(Date.now() + 1000000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'session-2',
          sessionToken: 'token-2',
          userId: 'user-123',
          expires: new Date(Date.now() + 2000000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions);

      const result = await getUserActiveSessions('user-123');

      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          expires: {
            gt: expect.any(Date),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
    });
  });

  describe('countUserActiveSessions', () => {
    it('counts active sessions for a user', async () => {
      vi.mocked(prisma.session.count).mockResolvedValue(3);

      const result = await countUserActiveSessions('user-123');

      expect(prisma.session.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          expires: {
            gt: expect.any(Date),
          },
        },
      });
      expect(result).toBe(3);
    });
  });
});
