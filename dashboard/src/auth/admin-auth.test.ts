import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveAdminActor } from '@/auth/admin-auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type { Session } from '@/entities/auth/session.entities';

const envMock = vi.hoisted(() => ({
  SUPER_ADMIN_USER_IDS: new Set<string>(['staff-1']),
  IS_DEVELOPMENT: false,
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ env: envMock }));
vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: vi.fn() }));
vi.mock('@/auth/api-auth', () => ({ getCachedSession: vi.fn() }));

function session(user: Partial<Session['user']> & { id: string }): Session {
  return {
    user: { name: null, email: `${user.id}@example.com`, ...user },
    session: { token: `token-${user.id}`, expiresAt: new Date() },
  };
}

function onCloud(isCloud: boolean) {
  vi.mocked(isFeatureEnabled).mockImplementation((flag) => flag === 'isCloud' && isCloud);
}

beforeEach(() => {
  vi.clearAllMocks();
  envMock.IS_DEVELOPMENT = false;
});

describe('resolveAdminActor on self-host', () => {
  beforeEach(() => onCloud(false));

  it('lets instance admins in, carrying their session token', () => {
    expect(resolveAdminActor(session({ id: 'user-1', role: 'admin' }))).toMatchObject({
      userId: 'user-1',
      edition: 'selfhost',
      sessionToken: 'token-user-1',
    });
  });

  it('does not require 2FA', () => {
    expect(resolveAdminActor(session({ id: 'user-1', role: 'admin', twoFactorEnabled: false }))).not.toBeNull();
  });

  it('keeps everyone else out, including allowlisted super admins', () => {
    expect(resolveAdminActor(session({ id: 'user-1', role: 'user' }))).toBeNull();
    expect(resolveAdminActor(session({ id: 'staff-1', role: null }))).toBeNull();
    expect(resolveAdminActor(null)).toBeNull();
  });
});

describe('resolveAdminActor on cloud', () => {
  beforeEach(() => onCloud(true));

  it('lets allowlisted super admins with 2FA in', () => {
    expect(resolveAdminActor(session({ id: 'staff-1', twoFactorEnabled: true }))).toMatchObject({
      edition: 'cloud',
    });
  });

  it('ignores the admin role entirely', () => {
    expect(resolveAdminActor(session({ id: 'user-1', role: 'admin', twoFactorEnabled: true }))).toBeNull();
  });

  it('requires 2FA outside development', () => {
    expect(resolveAdminActor(session({ id: 'staff-1', twoFactorEnabled: false }))).toBeNull();

    envMock.IS_DEVELOPMENT = true;
    expect(resolveAdminActor(session({ id: 'staff-1', twoFactorEnabled: false }))).not.toBeNull();
  });
});
