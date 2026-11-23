'use server';

import { z } from 'zod';
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

function requireMcpOAuth() {
  if (!isMcpOAuthEnabled()) throw new UserException('AI access is not available');
}

export const listMcpConnectionsAction = withUserAuth(async (user: User): Promise<McpConnectionsOverview> => {
  requireMcpOAuth();
  return listMcpConnections(user.id);
});

export const revokeMcpConnectionAction = withUserAuth(async (user: User, clientId: string): Promise<void> => {
  requireMcpOAuth();
  await revokeMcpConnection(user.id, ClientIdSchema.parse(clientId));
});

export const updateMcpConnectionDashboardsAction = withUserAuth(
  async (user: User, clientId: string, selection: McpGrantSelection): Promise<void> => {
    requireMcpOAuth();
    await updateMcpConnectionDashboards(
      user.id,
      ClientIdSchema.parse(clientId),
      McpGrantSelectionSchema.parse(selection),
    );
  },
);
