'server-only';

import prisma from '@/lib/postgres';
import { AdminUserSessionSchema, type AdminUserSession } from '@/entities/admin/adminUser.entities';

export async function countUserSessions(userId: string): Promise<number> {
  return prisma.session.count({ where: { userId } });
}

export async function deleteOtherUserSessions(userId: string, currentSessionToken: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      token: { not: currentSessionToken },
    },
  });

  return result.count;
}

export async function findActiveUserSessions(userId: string): Promise<AdminUserSession[]> {
  const sessions = await prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { id: true, createdAt: true, updatedAt: true, expiresAt: true, ipAddress: true, userAgent: true },
    orderBy: { updatedAt: 'desc' },
  });
  return sessions.map((session) => AdminUserSessionSchema.parse(session));
}

export async function findSessionIdByToken(token: string): Promise<string | null> {
  const session = await prisma.session.findUnique({ where: { token }, select: { id: true } });
  return session?.id ?? null;
}

export async function deleteUserSession(userId: string, sessionId: string): Promise<number> {
  const result = await prisma.session.deleteMany({ where: { id: sessionId, userId } });
  return result.count;
}

export async function deleteAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.deleteMany({ where: { userId } });
  return result.count;
}
