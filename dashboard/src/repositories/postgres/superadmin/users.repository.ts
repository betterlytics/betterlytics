import 'server-only';

import prisma from '@/lib/postgres';
import {
  SuperAdminUserListEntrySchema,
  type SuperAdminUserListEntry,
} from '@/entities/superadmin/user.entities';
import { ADMIN_PAGE_SIZE } from '@/constants/superadmin';

export async function listUsers(
  search?: string,
  page = 1,
): Promise<{ users: SuperAdminUserListEntry[]; total: number }> {
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        totpEnabled: true,
        createdAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return { users: rawUsers.map((u) => SuperAdminUserListEntrySchema.parse(u)), total };
}
