'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import type { DashboardMcpToken } from '@/entities/dashboard/mcpToken.entities';
import { hasPermission } from '@/lib/permissions';
import { getDashboardMcpTokens, removeDashboardFromToken } from '@/services/dashboard/mcpToken.service';

const TokenIdSchema = z.string().min(1).max(64);

export type DashboardMcpTokensView = { canManage: false } | { canManage: true; tokens: DashboardMcpToken[] };

/** Only owners and admins see the tokens that can read the dashboard; other members don't see each other's. */
export const getDashboardMcpTokensAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<DashboardMcpTokensView> => {
    if (!hasPermission(ctx.role, 'canManageSettings')) return { canManage: false };
    return { canManage: true, tokens: await getDashboardMcpTokens(ctx.dashboardId) };
  },
);

export const removeDashboardFromMcpTokenAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, tokenId: string) => {
    await removeDashboardFromToken(ctx.dashboardId, TokenIdSchema.parse(tokenId));
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/mcp`);
  },
  { permission: 'canManageSettings' },
);
