import { randomBytes } from 'crypto';
import prisma from '@/lib/postgres';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface CreateSessionInput {
  userId: string;
  maxAge?: number; // in seconds
}

export interface SessionData {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

/**
 * Generates a cryptographically secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a new database session for a user
 * This is used by the credentials provider since NextAuth doesn't auto-create sessions for it
 */
export async function createSession(input: CreateSessionInput): Promise<SessionData> {
  const { userId, maxAge = SESSION_MAX_AGE_SECONDS } = input;

  const sessionToken = generateSessionToken();
  const expires = new Date(Date.now() + maxAge * 1000);

  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  return {
    id: session.id,
    sessionToken: session.sessionToken,
    userId: session.userId,
    expires: session.expires,
  };
}

/**
 * Finds a session by its token
 */
export async function findSessionByToken(sessionToken: string): Promise<SessionData | null> {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    sessionToken: session.sessionToken,
    userId: session.userId,
    expires: session.expires,
  };
}

/**
 * Finds a session with its associated user
 */
export async function findSessionWithUser(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  return session;
}

/**
 * Deletes a session by its token
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  await prisma.session.delete({
    where: { sessionToken },
  }).catch(() => {
    // Session may already be deleted, ignore error
  });
}

/**
 * Deletes all sessions for a user (logout everywhere)
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { userId },
  });
  return result.count;
}

/**
 * Updates a session's expiry time (extends session)
 */
export async function extendSession(sessionToken: string, maxAge: number = SESSION_MAX_AGE_SECONDS): Promise<SessionData | null> {
  const expires = new Date(Date.now() + maxAge * 1000);

  try {
    const session = await prisma.session.update({
      where: { sessionToken },
      data: { expires },
    });

    return {
      id: session.id,
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a session is expired
 */
export function isSessionExpired(session: { expires: Date }): boolean {
  return new Date() > session.expires;
}

/**
 * Cleans up expired sessions from the database
 * This should be run periodically (e.g., via a cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}

/**
 * Gets all active sessions for a user
 */
export async function getUserActiveSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expires: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return sessions.map((session: { id: string; createdAt: Date; expires: Date }) => ({
    id: session.id,
    createdAt: session.createdAt,
    expires: session.expires,
  }));
}

/**
 * Counts active sessions for a user
 */
export async function countUserActiveSessions(userId: string): Promise<number> {
  const count = await prisma.session.count({
    where: {
      userId,
      expires: {
        gt: new Date(),
      },
    },
  });
  return count;
}
