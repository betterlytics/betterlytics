'server-only';

import * as SessionRepository from '@/repositories/postgres/session.repository';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60; // 24 hours

export async function invalidateAllUserSessions(userId: string): Promise<number> {
  return SessionRepository.deleteAllUserSessions(userId);
}

export async function invalidateOtherUserSessions(userId: string, currentSessionToken: string): Promise<number> {
  return SessionRepository.deleteOtherUserSessions(userId, currentSessionToken);
}

export async function countUserSessions(userId: string): Promise<number> {
  return SessionRepository.countUserSessions(userId);
}
