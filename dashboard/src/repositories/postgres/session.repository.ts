'server-only';

import prisma from '@/lib/postgres';

export async function deleteAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { userId },
  });

  return result.count;
}

export async function countUserSessions(userId: string): Promise<number> {
  return prisma.session.count({ where: { userId } });
}

export async function deleteOtherUserSessions(userId: string, currentSessionToken: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      sessionToken: { not: currentSessionToken },
    },
  });

  return result.count;
}
