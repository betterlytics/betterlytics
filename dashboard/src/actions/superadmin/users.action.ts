'use server';

import { withSuperAdminAction, withSuperAdminQuery, type SuperAdminCtx } from '@/middlewares/withSuperAdminAction';
import { isSuperAdmin } from '@/auth/superAdmin-auth';
import { UserException } from '@/lib/exceptions';
import { getUsers, removeUser } from '@/services/superadmin/users.service';

export const getUsersAction = withSuperAdminQuery(async (_ctx: SuperAdminCtx, search?: string, page?: number) => {
  return getUsers(search, page);
});

export const deleteUserAction = withSuperAdminAction(
  'delete_user',
  'user',
  (userId: string) => ({ targetId: userId, payload: { deletedUserId: userId } }),
  async (ctx: SuperAdminCtx, userId: string) => {
    if (userId === ctx.actorUserId) {
      throw new UserException('Super admins cannot delete themselves');
    }
    if (isSuperAdmin(userId)) {
      throw new UserException('Super admins cannot delete other super admins');
    }
    await removeUser(userId);
  },
);
