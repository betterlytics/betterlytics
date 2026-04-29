'server-only';

import { listUsers } from '@/repositories/postgres/superadmin/users.repository';
import { ADMIN_PAGE_SIZE } from '@/constants/superadmin';
import { anonymizeUser } from '@/repositories/postgres/user.repository';

export async function getUsers(search?: string, page = 1) {
  const { users, total } = await listUsers(search, page);
  return {
    users,
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    totalPages: Math.ceil(total / ADMIN_PAGE_SIZE),
  };
}

export async function removeUser(userId: string): Promise<void> {
  await anonymizeUser(userId);
}
