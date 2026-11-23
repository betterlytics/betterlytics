'use server';

import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { withUserAuth } from '@/auth/auth-actions';
import type { User } from '@/entities/auth/session.entities';
import { McpGrantSelectionSchema, type McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';
import { UserException } from '@/lib/exceptions';
import { isMcpOAuthEnabled } from '@/mcp/auth/oauth';
import {
  listMcpConnections,
  revokeMcpConnection,
  updateMcpConnectionDashboards,
  type McpConnectionsOverview,
} from '@/services/auth/mcpConnections.service';

const ClientIdSchema = z.string().min(1).max(2048);

async function requireMcpOAuth() {
  if (isMcpOAuthEnabled()) return;
  const t = await getTranslations('validation.mcpConnections');
  throw new UserException(t('unavailable'));
}

export const listMcpConnectionsAction = withUserAuth(async (user: User): Promise<McpConnectionsOverview> => {
  await requireMcpOAuth();
  return listMcpConnections(user.id);
});

export const revokeMcpConnectionAction = withUserAuth(async (user: User, clientId: string): Promise<void> => {
  await requireMcpOAuth();
  await revokeMcpConnection(user.id, ClientIdSchema.parse(clientId));
});

export const updateMcpConnectionDashboardsAction = withUserAuth(
  async (user: User, clientId: string, selection: McpGrantSelection): Promise<void> => {
    await requireMcpOAuth();
    await updateMcpConnectionDashboards(
      user.id,
      ClientIdSchema.parse(clientId),
      McpGrantSelectionSchema.parse(selection),
    );
  },
);
