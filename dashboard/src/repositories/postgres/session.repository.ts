'server-only';

import prisma from '@/lib/postgres';

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
