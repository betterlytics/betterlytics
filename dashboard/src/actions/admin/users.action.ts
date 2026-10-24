'use server';

import { z } from 'zod';
import { withAdminAction, withAdminQuery, type AdminCtx } from '@/middlewares/withAdminAction';
import {
  AdminDeleteUserInputSchema,
  AdminUserListQuerySchema,
  type AdminDeleteUserInput,
  type AdminUserListQuery,
} from '@/entities/admin/adminUser.entities';
import * as AdminUsersService from '@/services/admin/users.service';

const UserIdSchema = z.string().min(1);

const userTarget = async (userId: string) => ({
  targetId: userId,
  targetLabel: await AdminUsersService.getTargetLabel(userId),
});

export const getAdminUsersAction = withAdminQuery(
  'users',
  async (ctx: AdminCtx, query: Partial<AdminUserListQuery>) => {
    return AdminUsersService.listUsers(ctx.actor, AdminUserListQuerySchema.parse(query));
  },
);

export const getAdminUserAction = withAdminQuery('users', async (ctx: AdminCtx, userId: string) => {
  return AdminUsersService.getUser(ctx.actor, UserIdSchema.parse(userId));
});

export const getDeleteUserContextAction = withAdminQuery('users', async (ctx: AdminCtx, userId: string) => {
  return AdminUsersService.getDeleteUserContext(ctx.actor, UserIdSchema.parse(userId));
});

export const disableUserAction = withAdminAction(
  { section: 'users', action: 'disable_user', targetType: 'user', audit: userTarget },
  async (ctx: AdminCtx, userId: string) => {
    await AdminUsersService.disableUser(ctx.actor, UserIdSchema.parse(userId));
  },
);

export const enableUserAction = withAdminAction(
  { section: 'users', action: 'enable_user', targetType: 'user', audit: userTarget },
  async (ctx: AdminCtx, userId: string) => {
    await AdminUsersService.enableUser(ctx.actor, UserIdSchema.parse(userId));
  },
);

export const setInstanceAdminAction = withAdminAction(
  {
    section: 'users',
    action: 'set_instance_admin',
    targetType: 'user',
    audit: async (userId: string, isAdmin: boolean) => ({ ...(await userTarget(userId)), payload: { isAdmin } }),
  },
  async (ctx: AdminCtx, userId: string, isAdmin: boolean) => {
    await AdminUsersService.setInstanceAdmin(ctx.actor, UserIdSchema.parse(userId), z.boolean().parse(isAdmin));
  },
);

export const revokeUserSessionAction = withAdminAction(
  {
    section: 'users',
    action: 'revoke_user_session',
    targetType: 'user',
    audit: async (userId: string, sessionId: string) => ({
      ...(await userTarget(userId)),
      payload: { sessionId },
    }),
  },
  async (ctx: AdminCtx, userId: string, sessionId: string) => {
    await AdminUsersService.revokeUserSession(
      ctx.actor,
      UserIdSchema.parse(userId),
      z.string().min(1).parse(sessionId),
    );
  },
);

export const revokeAllUserSessionsAction = withAdminAction(
  { section: 'users', action: 'revoke_user_sessions', targetType: 'user', audit: userTarget },
  async (ctx: AdminCtx, userId: string) => {
    return AdminUsersService.revokeAllUserSessions(ctx.actor, UserIdSchema.parse(userId));
  },
);

export const createPasswordResetLinkAction = withAdminAction(
  { section: 'users', action: 'create_password_reset_link', targetType: 'user', audit: userTarget },
  async (ctx: AdminCtx, userId: string) => {
    return AdminUsersService.createPasswordResetLink(ctx.actor, UserIdSchema.parse(userId));
  },
);

export const emailPasswordResetLinkAction = withAdminAction(
  { section: 'users', action: 'email_password_reset_link', targetType: 'user', audit: userTarget },
  async (ctx: AdminCtx, userId: string) => {
    await AdminUsersService.emailPasswordResetLink(ctx.actor, UserIdSchema.parse(userId));
  },
);

export const resetTwoFactorAction = withAdminAction(
  { section: 'users', action: 'reset_two_factor', targetType: 'user', audit: userTarget },
  async (ctx: AdminCtx, userId: string) => {
    await AdminUsersService.resetTwoFactor(ctx.actor, UserIdSchema.parse(userId));
  },
);

export const deleteUserAction = withAdminAction(
  {
    section: 'users',
    action: 'delete_user',
    targetType: 'user',
    audit: async (userId: string, input: AdminDeleteUserInput) => ({ targetId: userId, payload: input }),
  },
  async (ctx: AdminCtx, userId: string, input: AdminDeleteUserInput) => {
    await AdminUsersService.deleteUser(
      ctx.actor,
      UserIdSchema.parse(userId),
      AdminDeleteUserInputSchema.parse(input),
    );
  },
);
