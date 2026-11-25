'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import type { DashboardMcpToken } from '@/entities/dashboard/mcpToken.entities';
import { hasPermission } from '@/lib/permissions';
import { getDashboardMcpTokens, removeDashboardFromToken } from '@/services/dashboard/mcpToken.service';
import {
  getDashboardMcpConnections,
  removeDashboardFromMcpConnection,
  type DashboardMcpConnection,
} from '@/services/auth/mcpConnections.service';

const TokenIdSchema = z.string().min(1).max(64);
const ConsentIdSchema = z.string().min(1).max(64);

export type DashboardMcpTokensView =
  { canManage: false } | { canManage: true; tokens: DashboardMcpToken[]; connections: DashboardMcpConnection[] };

/**
 * Only owners and admins see the connections and tokens that can read the dashboard; other members don't see each
 * other's.
 */
export const getDashboardMcpTokensAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<DashboardMcpTokensView> => {
    if (!hasPermission(ctx.role, 'canManageSettings')) return { canManage: false };
    const [tokens, connections] = await Promise.all([
      getDashboardMcpTokens(ctx.dashboardId),
      getDashboardMcpConnections(ctx.dashboardId),
    ]);
    return { canManage: true, tokens, connections };
  },
);

export const removeDashboardFromMcpTokenAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, tokenId: string) => {
    await removeDashboardFromToken(ctx.dashboardId, TokenIdSchema.parse(tokenId));
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/mcp`);
  },
  { permission: 'canManageSettings' },
);

export const removeDashboardFromMcpConnectionAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, consentId: string) => {
    await removeDashboardFromMcpConnection(ctx.dashboardId, ConsentIdSchema.parse(consentId));
    revalidatePath(`/dashboard/${ctx.dashboardId}/settings/mcp`);
  },
  { permission: 'canManageSettings' },
);
