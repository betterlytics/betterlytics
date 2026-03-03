'use server';

import { revalidatePath } from 'next/cache';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import {
  createMcpTokenForDashboard,
  getMcpTokensForDashboard,
  removeMcpToken,
} from '@/services/dashboard/mcpToken.service';

export const getMcpTokensAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  const tokens = await getMcpTokensForDashboard(ctx.dashboardId);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return tokens.map(({ tokenHash, ...rest }) => rest);
});

export const createMcpTokenAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, name: string) => {
    const token = await createMcpTokenForDashboard(ctx.dashboardId, name, ctx.userId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/mcp`);
    return token;
  },
);

export const deleteMcpTokenAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, tokenId: string) => {
    await removeMcpToken(tokenId, ctx.dashboardId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/mcp`);
  },
);
