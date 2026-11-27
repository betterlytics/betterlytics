import 'server-only';

import { createHash, randomBytes } from 'crypto';
import type { DashboardRole } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { UserException } from '@/lib/exceptions';
import {
  createMcpToken,
  deletePersonalMcpToken,
  findDashboardMcpTokens,
  findPersonalMcpTokens,
  removeDashboardFromMcpToken,
  replaceMcpTokenDashboards,
} from '@/repositories/postgres/mcpToken.repository';
import { findUserMemberships } from '@/repositories/postgres/dashboard.repository';
import {
  assertPickedDashboardsAvailable,
  grantableDashboards,
  grantedDashboards,
} from '@/services/auth/mcpAccess.service';
import {
  DashboardMcpToken,
  MCP_TOKEN_LIFETIME_DAYS,
  McpToken,
  McpTokenLifetime,
} from '@/entities/dashboard/mcpToken.entities';

export type PersonalMcpToken = McpToken & {
  // the picked dashboards the creator is still a member of, including ones with AI access off
  dashboards: { id: string; domain: string }[];
};

export type PersonalMcpTokensOverview = {
  tokens: PersonalMcpToken[];
  // every dashboard the user can pick, for creating or editing a token
  dashboards: { id: string; domain: string; role: DashboardRole; aiAccessEnabled: boolean }[];
};

function generateMcpToken(): string {
  return `btl_${randomBytes(16).toString('hex')}`;
}

function expiresAtFromLifetime(lifetime: McpTokenLifetime): Date | null {
  if (lifetime === 'never') return null;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + MCP_TOKEN_LIFETIME_DAYS[lifetime]);
  return expiresAt;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function tokenNotFound(): Promise<UserException> {
  const t = await getTranslations('validation.mcpTokens');
  return new UserException(t('notFound'));
}

export async function createPersonalMcpToken(
  userId: string,
  name: string,
  dashboardIds: string[],
  lifetime: McpTokenLifetime,
): Promise<McpToken & { plainToken: string }> {
  await assertPickedDashboardsAvailable(userId, { allDashboards: false, dashboardIds });

  const plainToken = generateMcpToken();
  const row = await createMcpToken(
    { name, createdBy: userId, dashboardIds, expiresAt: expiresAtFromLifetime(lifetime) },
    hashToken(plainToken),
  );
  return { ...row, plainToken };
}

export async function listPersonalMcpTokens(userId: string): Promise<PersonalMcpTokensOverview> {
  const [records, memberships] = await Promise.all([findPersonalMcpTokens(userId), findUserMemberships(userId)]);

  const tokens = records.map(({ dashboardIds, ...token }): PersonalMcpToken => ({
    ...token,
    dashboards: grantedDashboards({ allDashboards: false, dashboardIds }, memberships)
      .map(({ dashboardId, domain }) => ({ id: dashboardId, domain }))
      .sort((a, b) => a.domain.localeCompare(b.domain)),
  }));

  return { tokens, dashboards: grantableDashboards(memberships) };
}

/** Takes effect on the token's next call; the token string doesn't change. */
export async function updatePersonalMcpTokenDashboards(
  userId: string,
  tokenId: string,
  dashboardIds: string[],
): Promise<void> {
  const token = (await findPersonalMcpTokens(userId)).find((record) => record.id === tokenId);
  if (!token) throw await tokenNotFound();
  await assertPickedDashboardsAvailable(
    userId,
    { allDashboards: false, dashboardIds },
    { allDashboards: false, dashboardIds: token.dashboardIds },
  );
  if (!(await replaceMcpTokenDashboards(tokenId, userId, dashboardIds))) throw await tokenNotFound();
}

export async function revokePersonalMcpToken(userId: string, tokenId: string): Promise<void> {
  if ((await deletePersonalMcpToken(tokenId, userId)) === 0) throw await tokenNotFound();
}

export async function getDashboardMcpTokens(dashboardId: string): Promise<DashboardMcpToken[]> {
  return findDashboardMcpTokens(dashboardId);
}

/** Only this dashboard leaves the token; it keeps working on the creator's other picks. */
export async function removeDashboardFromToken(dashboardId: string, tokenId: string): Promise<void> {
  if ((await removeDashboardFromMcpToken(tokenId, dashboardId)) === 0) throw await tokenNotFound();
}
