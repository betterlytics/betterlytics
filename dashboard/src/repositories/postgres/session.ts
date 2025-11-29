import prisma from '@/lib/postgres';
import { randomBytes } from 'crypto';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

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
