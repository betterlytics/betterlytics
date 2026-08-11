/**
 * Characterization tests for the session service (internal issue #50).
 *
 * Pins the session contract the better-auth cutover (#52) must handle: token
 * format, cookie names (secure-prefixed cookie wins), and the 30-day/24-hour
 * lifetime constants.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cookies } from 'next/headers';
import {
  generateSessionToken,
  getCurrentSessionTokenFromCookies,
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from '@/services/session.service';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));
// Keeps the real session repository (and its Prisma client) out of the import graph.
vi.mock('@/repositories/postgres/session.repository', () => ({
  deleteAllUserSessions: vi.fn(),
  deleteOtherUserSessions: vi.fn(),
  countUserSessions: vi.fn(),
}));

function mockCookieStore(values: Record<string, string>) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name in values ? { name, value: values[name] } : undefined),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('session lifetime constants', () => {
  it('sessions live 30 days and refresh every 24 hours', () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(SESSION_UPDATE_AGE_SECONDS).toBe(24 * 60 * 60);
  });
});

describe('generateSessionToken', () => {
  it('produces a 64-char hex token', () => {
    expect(generateSessionToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a unique token per call', () => {
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });
});

describe('getCurrentSessionTokenFromCookies', () => {
  it('reads the plain next-auth session cookie', async () => {
    mockCookieStore({ 'next-auth.session-token': 'plain-token' });

    expect(await getCurrentSessionTokenFromCookies()).toBe('plain-token');
  });

  it('reads the __Secure-prefixed cookie (HTTPS deploys)', async () => {
    mockCookieStore({ '__Secure-next-auth.session-token': 'secure-token' });

    expect(await getCurrentSessionTokenFromCookies()).toBe('secure-token');
  });

  it('prefers the __Secure-prefixed cookie when both exist', async () => {
    mockCookieStore({
      'next-auth.session-token': 'plain-token',
      '__Secure-next-auth.session-token': 'secure-token',
    });

    expect(await getCurrentSessionTokenFromCookies()).toBe('secure-token');
  });

  it('returns undefined when neither cookie is present', async () => {
    mockCookieStore({});

    expect(await getCurrentSessionTokenFromCookies()).toBeUndefined();
  });
});
