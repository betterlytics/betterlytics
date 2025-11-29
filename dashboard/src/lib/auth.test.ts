import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing auth
vi.mock('@/lib/postgres', () => ({
  default: {
    session: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/services/auth.service', () => ({
  verifyCredentials: vi.fn(),
  attemptAdminInitialization: vi.fn(),
}));

vi.mock('@/services/session.service', () => ({
  generateSessionToken: vi.fn(() => 'mock-session-token-123'),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    set: vi.fn(),
    get: vi.fn(),
  })),
}));

vi.mock('@/lib/env', () => ({
  env: {
    GITHUB_ID: undefined,
    GITHUB_SECRET: undefined,
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
  },
}));

// Import after mocking
import { authOptions } from './auth';
import prisma from '@/lib/postgres';

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Strategy', () => {
    it('uses database strategy', () => {
      expect(authOptions.session?.strategy).toBe('database');
    });

    it('has 30-day session max age', () => {
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      expect(authOptions.session?.maxAge).toBe(thirtyDaysInSeconds);
    });
  });

  describe('Adapter', () => {
    it('has adapter configured', () => {
      expect(authOptions.adapter).toBeDefined();
    });

    it('adapter has createSession method', () => {
      expect(authOptions.adapter?.createSession).toBeDefined();
      expect(typeof authOptions.adapter?.createSession).toBe('function');
    });
  });

  describe('JWT Override', () => {
    it('has custom encode function', () => {
      expect(authOptions.jwt?.encode).toBeDefined();
      expect(typeof authOptions.jwt?.encode).toBe('function');
    });

    it('has custom decode function', () => {
      expect(authOptions.jwt?.decode).toBeDefined();
      expect(typeof authOptions.jwt?.decode).toBe('function');
    });

    it('encode returns session token when present in token', async () => {
      const params = {
        token: { sessionToken: 'my-session-token' },
        secret: 'test-secret',
      };
      const result = await authOptions.jwt?.encode?.(params as any);
      expect(result).toBe('my-session-token');
    });

    it('decode returns null for non-JWT tokens (session tokens)', async () => {
      const params = {
        token: 'non-jwt-session-token',
        secret: 'test-secret',
      };
      const result = await authOptions.jwt?.decode?.(params as any);
      expect(result).toBeNull();
    });
  });

  describe('Providers', () => {
    it('includes credentials provider', () => {
      const credentialsProvider = authOptions.providers.find(
        (p) => p.id === 'credentials' || p.name === 'Credentials'
      );
      expect(credentialsProvider).toBeDefined();
    });
  });

  describe('Callbacks', () => {
    it('has signIn callback', () => {
      expect(authOptions.callbacks?.signIn).toBeDefined();
    });

    it('has session callback', () => {
      expect(authOptions.callbacks?.session).toBeDefined();
    });

    it('has jwt callback', () => {
      expect(authOptions.callbacks?.jwt).toBeDefined();
    });

    describe('signIn callback - Google OAuth', () => {
      it('updates emailVerified for Google OAuth when user is unverified', async () => {
        const mockUser = { id: 'user-123', emailVerified: null, email_verified: true };
        const mockAccount = { provider: 'google' };

        vi.mocked(prisma.user.update).mockResolvedValue({} as any);

        const result = await authOptions.callbacks?.signIn?.({
          user: mockUser as any,
          account: mockAccount as any,
          profile: undefined,
          email: undefined,
          credentials: undefined,
        });

        expect(result).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: { emailVerified: expect.any(Date) },
        });
      });

      it('does not update emailVerified if user is already verified', async () => {
        const mockUser = { id: 'user-123', emailVerified: new Date(), email_verified: true };
        const mockAccount = { provider: 'google' };

        const result = await authOptions.callbacks?.signIn?.({
          user: mockUser as any,
          account: mockAccount as any,
          profile: undefined,
          email: undefined,
          credentials: undefined,
        });

        expect(result).toBe(true);
        expect(prisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe('session callback', () => {
      it('populates session with user data from database', async () => {
        const mockDbUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: new Date(),
          role: 'admin',
          totpEnabled: true,
          passwordHash: 'hash123',
          onboardingCompletedAt: new Date(),
          termsAcceptedAt: new Date(),
          termsAcceptedVersion: 1,
          changelogVersionSeen: 'v1',
          settings: {
            theme: 'dark',
            language: 'en',
            avatar: 'default',
            emailNotifications: true,
            marketingEmails: false,
          },
        };

        const mockSession = {
          user: {
            id: '',
            name: '',
            email: '',
          },
          expires: new Date().toISOString(),
        };

        const mockUser = { id: 'user-123' };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);

        const result = await authOptions.callbacks?.session?.({
          session: mockSession as any,
          user: mockUser as any,
          trigger: 'update',
          newSession: undefined,
        });

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          include: { settings: true },
        });

        expect(result?.user.id).toBe('user-123');
        expect(result?.user.name).toBe('Test User');
        expect(result?.user.email).toBe('test@example.com');
        expect(result?.user.role).toBe('admin');
        expect(result?.user.totpEnabled).toBe(true);
        expect(result?.user.hasPassword).toBe(true);
        expect(result?.user.settings?.theme).toBe('dark');
      });

      it('handles user without settings', async () => {
        const mockDbUser = {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: null,
          role: 'user',
          totpEnabled: false,
          passwordHash: null,
          onboardingCompletedAt: null,
          termsAcceptedAt: null,
          termsAcceptedVersion: null,
          changelogVersionSeen: null,
          settings: null,
        };

        const mockSession = {
          user: {
            id: '',
            name: '',
            email: '',
          },
          expires: new Date().toISOString(),
        };

        const mockUser = { id: 'user-123' };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser as any);

        const result = await authOptions.callbacks?.session?.({
          session: mockSession as any,
          user: mockUser as any,
          trigger: 'update',
          newSession: undefined,
        });

        expect(result?.user.hasPassword).toBe(false);
        expect(result?.user.changelogVersionSeen).toBe('v0');
        expect(result?.user.settings).toBeUndefined();
      });
    });
  });

  describe('Pages Configuration', () => {
    it('has custom sign-in page', () => {
      expect(authOptions.pages?.signIn).toBe('/signin');
    });

    it('has custom error page', () => {
      expect(authOptions.pages?.error).toBe('/signin');
    });

    it('has custom new user page', () => {
      expect(authOptions.pages?.newUser).toBe('/onboarding');
    });
  });
});
