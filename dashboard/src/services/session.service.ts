'server-only';

import { randomBytes } from 'crypto';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60; // 24 hours

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
