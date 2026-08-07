'use server';

import { revalidatePath } from 'next/cache';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import {
  createMcpTokenForDashboard,
  getMcpTokensForDashboard,
  removeMcpToken,
} from '@/services/dashboard/mcpToken.service';
import { McpTokenLifetime, McpTokenLifetimeSchema } from '@/entities/dashboard/mcpToken.entities';

export const getMcpTokensAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  return await getMcpTokensForDashboard(ctx.dashboardId);
});

export const createMcpTokenAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, name: string, lifetime: McpTokenLifetime) => {
    const token = await createMcpTokenForDashboard(
      ctx.dashboardId,
      name,
      ctx.userId,
      McpTokenLifetimeSchema.parse(lifetime),
    );
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/mcp`);
    return token;
  },
);

export const deleteMcpTokenAction = withDashboardMutationAuthContext(async (ctx: AuthContext, tokenId: string) => {
  await removeMcpToken(tokenId, ctx.dashboardId);
  revalidatePath(`/dashboard/${ctx.dashboardId}/settings/mcp`);
});
