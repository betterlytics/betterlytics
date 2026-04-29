'use server';

import { withSuperAdminAction, withSuperAdminQuery, type SuperAdminCtx } from '@/middlewares/withSuperAdminAction';
import { getUsers, removeUser } from '@/services/superadmin/users.service';

export const getUsersAction = withSuperAdminQuery(async (_ctx: SuperAdminCtx, search?: string, page?: number) => {
  return getUsers(search, page);
});

export const deleteUserAction = withSuperAdminAction(
  'delete_user',
  'user',
  async (_ctx: SuperAdminCtx, userId: string) => {
    await removeUser(userId);
    return { result: undefined, targetId: userId, payload: { deletedUserId: userId } };
  },
);
