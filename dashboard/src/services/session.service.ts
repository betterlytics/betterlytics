import { randomBytes } from 'crypto';
import type { findUserByEmail } from '@/repositories/postgres/user';
import type { getUserSettings } from '@/services/userSettings';

export const USER_SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

export type CachedUserData = {
  user: Awaited<ReturnType<typeof findUserByEmail>>;
  settings: Awaited<ReturnType<typeof getUserSettings>>;
};

/** In-memory cache for user data, keyed by session token. Cleared on server restart. */
export const sessionUserCache = new Map<string, CachedUserData>();

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
