import prisma from '@/lib/postgres';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

const SESSION_COOKIE = 'next-auth.session-token';
const SESSION_COOKIE_SECURE = '__Secure-next-auth.session-token';

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function deleteExpiredSessions(): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error deleting expired sessions:', error);
  }
}

/** Gets the current session token from cookies. */
export async function getCurrentSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const isSecure = process.env.NODE_ENV === 'production';
  const cookieName = isSecure ? SESSION_COOKIE_SECURE : SESSION_COOKIE;
  return cookieStore.get(cookieName)?.value;
}

/** Deletes all sessions for a user, optionally excluding a specific session token. */
export async function deleteUserSessions(userId: string, excludeSessionToken?: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: {
        userId,
        ...(excludeSessionToken && { sessionToken: { not: excludeSessionToken } }),
      },
    });
  } catch (error) {
    console.error(`Error deleting sessions for user ${userId}:`, error);
    throw error;
  }
}
