import type { findUserByEmail } from '@/repositories/postgres/user';
import type { getUserSettings } from '@/services/userSettings';

export const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - matches previous JWT implementation

// In-memory cache for user data (keyed by session token)
// Works with userLastFetched in DB for consistency across server restarts
export type CachedUserData = {
  user: Awaited<ReturnType<typeof findUserByEmail>>;
  settings: Awaited<ReturnType<typeof getUserSettings>>;
};

export const sessionUserCache = new Map<string, CachedUserData>();

/**
 * Clear cached user data for a specific session token
 * Call this when a session is invalidated (e.g., logout)
 */
export function clearSessionUserCache(sessionToken: string): void {
  sessionUserCache.delete(sessionToken);
}

/**
 * Clear all cached user data
 * Call this when doing bulk session cleanup
 */
export function clearAllSessionUserCache(): void {
  sessionUserCache.clear();
}
