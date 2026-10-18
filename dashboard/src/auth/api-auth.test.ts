import { describe, it, expect, vi, beforeEach } from 'vitest';

const getSession = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/lib/better-auth', () => ({ auth: { api: { getSession } } }));
vi.mock('@/services/auth/auth.service', () => ({}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({}));
vi.mock('@/lib/env', () => ({ env: {} }));

import { getCachedSession } from '@/auth/api-auth';

function sessionFor(user: { id: string; disabledAt: Date | null }) {
  return {
    user: { name: null, email: `${user.id}@example.com`, ...user },
    session: { token: `token-${user.id}`, expiresAt: new Date() },
  };
}

beforeEach(() => vi.clearAllMocks());

describe('getCachedSession', () => {
  it('returns the session of an enabled user', async () => {
    getSession.mockResolvedValue(sessionFor({ id: 'user-1', disabledAt: null }));
    expect(await getCachedSession()).toMatchObject({ user: { id: 'user-1' }, session: { token: 'token-user-1' } });
  });

  it('treats a disabled user as signed out even when their session row survived', async () => {
    getSession.mockResolvedValue(sessionFor({ id: 'user-1', disabledAt: new Date() }));
    expect(await getCachedSession()).toBeNull();
  });

  it('returns null without a session', async () => {
    getSession.mockResolvedValue(null);
    expect(await getCachedSession()).toBeNull();
  });
});
