/**
 * Characterization tests for the session service (internal issue #50).
 *
 * Pins the 30-day/24-hour session lifetimes, which the better-auth config
 * consumes directly (better-auth-config.test.ts covers that wiring).
 */
import { describe, it, expect, vi } from 'vitest';
import { SESSION_MAX_AGE_SECONDS, SESSION_UPDATE_AGE_SECONDS } from '@/services/session.service';

// Keeps the real session repository (and its Prisma client) out of the import graph.
vi.mock('@/repositories/postgres/session.repository', () => ({
  deleteAllUserSessions: vi.fn(),
  deleteOtherUserSessions: vi.fn(),
  countUserSessions: vi.fn(),
}));

describe('session lifetime constants', () => {
  it('sessions live 30 days and refresh every 24 hours', () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(SESSION_UPDATE_AGE_SECONDS).toBe(24 * 60 * 60);
  });
});
