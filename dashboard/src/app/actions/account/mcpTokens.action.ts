'use server';

import { z } from 'zod';
import { withUserAuth } from '@/auth/auth-actions';
import type { User } from '@/entities/auth/session.entities';
import {
  McpTokenDashboardIdsSchema,
  McpTokenLifetime,
  McpTokenLifetimeSchema,
  McpTokenNameSchema,
} from '@/entities/dashboard/mcpToken.entities';
import {
  createPersonalMcpToken,
  listPersonalMcpTokens,
  revokePersonalMcpToken,
  updatePersonalMcpTokenDashboards,
  type PersonalMcpTokensOverview,
} from '@/services/dashboard/mcpToken.service';

const TokenIdSchema = z.string().min(1).max(64);

export const listPersonalMcpTokensAction = withUserAuth(async (user: User): Promise<PersonalMcpTokensOverview> =>
  listPersonalMcpTokens(user.id),
);

export const createPersonalMcpTokenAction = withUserAuth(
  async (user: User, name: string, dashboardIds: string[], lifetime: McpTokenLifetime) =>
    createPersonalMcpToken(
      user.id,
      McpTokenNameSchema.parse(name),
      McpTokenDashboardIdsSchema.parse(dashboardIds),
      McpTokenLifetimeSchema.parse(lifetime),
    ),
);

export const updatePersonalMcpTokenDashboardsAction = withUserAuth(
  async (user: User, tokenId: string, dashboardIds: string[]): Promise<void> => {
    await updatePersonalMcpTokenDashboards(
      user.id,
      TokenIdSchema.parse(tokenId),
      McpTokenDashboardIdsSchema.parse(dashboardIds),
    );
  },
);

export const revokePersonalMcpTokenAction = withUserAuth(async (user: User, tokenId: string): Promise<void> => {
  await revokePersonalMcpToken(user.id, TokenIdSchema.parse(tokenId));
});
