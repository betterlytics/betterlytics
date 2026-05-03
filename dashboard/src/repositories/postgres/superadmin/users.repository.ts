import 'server-only';

import prisma from '@/lib/postgres';
import { UserSchema, type User } from '@/entities/auth/user.entities';
import { ADMIN_PAGE_SIZE } from '@/constants/superadmin';

export async function listUsers(search?: string, page = 1): Promise<{ users: User[]; total: number }> {
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [rawUsers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return { users: rawUsers.map((u) => UserSchema.parse(u)), total };
}
