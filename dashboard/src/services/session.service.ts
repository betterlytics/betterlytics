import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import * as SessionRepository from '@/repositories/postgres/session.repository';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60; // 24 hours

const SESSION_TOKEN_COOKIE = 'next-auth.session-token';
const SECURE_SESSION_TOKEN_COOKIE = '__Secure-next-auth.session-token';

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function getCurrentSessionTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SECURE_SESSION_TOKEN_COOKIE)?.value ?? cookieStore.get(SESSION_TOKEN_COOKIE)?.value;
}

export async function invalidateAllUserSessions(userId: string): Promise<number> {
  return SessionRepository.deleteAllUserSessions(userId);
}

export async function invalidateOtherUserSessions(userId: string, currentSessionToken: string): Promise<number> {
  return SessionRepository.deleteOtherUserSessions(userId, currentSessionToken);
}
