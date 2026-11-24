import 'server-only';

import type { DashboardRole } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import type { McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';
import { UserException } from '@/lib/exceptions';
import { clientDisplayName, clientIdentityHost, urlHost } from '@/mcp/auth/client-identity';
import { MCP_READ_SCOPE } from '@/mcp/auth/oauth';
import { findUserMemberships } from '@/repositories/postgres/dashboard.repository';
import {
  deleteAllMcpConnections,
  deleteMcpConnection,
  findDashboardMcpConnections,
  findMcpConnections,
  findMcpConsentGrant,
  removeDashboardFromMcpGrant,
  replaceMcpGrant,
} from '@/repositories/postgres/mcpGrant.repository';
import {
  assertPickedDashboardsAvailable,
  grantableDashboards,
  grantedDashboards,
} from '@/services/auth/mcpAccess.service';

// Each scope gets its own label, so a later write scope doesn't read as "Read analytics"
const SCOPE_LABELS = { [MCP_READ_SCOPE]: 'readAnalytics' } as const;
export type McpScopeLabel = (typeof SCOPE_LABELS)[keyof typeof SCOPE_LABELS];

export type McpConnection = {
  clientId: string;
  name: string;
  // the client_id host for a CIMD client, which vouches for it; the first redirect host for a DCR client
  host: string | null;
  verified: boolean;
  scopes: McpScopeLabel[];
  allDashboards: boolean;
  // the granted dashboards the user is still a member of, including ones with AI access off
  dashboards: { id: string; domain: string }[];
  connectedAt: Date | null;
  lastUsedAt: Date | null;
};

export type McpConnectionsOverview = {
  connections: McpConnection[];
  // every dashboard the user can grant, for editing a connection
  dashboards: { id: string; domain: string; role: DashboardRole; aiAccessEnabled: boolean }[];
};

// A member's connection as the dashboard's owners and admins see it: only its link to that dashboard
export type DashboardMcpConnection = {
  consentId: string;
  name: string;
  member: { name: string | null; email: string };
  connectedAt: Date | null;
  lastUsedAt: Date | null;
};

async function connectionNotFound(): Promise<UserException> {
  const t = await getTranslations('validation.mcpConnections');
  return new UserException(t('notFound'));
}

function hasScopeLabel(scope: string): scope is keyof typeof SCOPE_LABELS {
  return Object.hasOwn(SCOPE_LABELS, scope);
}

function clientName(client: {
  clientId: string;
  name: string | null;
  redirectUris: string[];
  discovered: boolean;
}) {
  const identityHost = clientIdentityHost(client);
  const redirectHost = client.redirectUris.length > 0 ? urlHost(client.redirectUris[0]!) : null;
  return {
    host: identityHost ?? redirectHost,
    name: clientDisplayName(client.name, identityHost, redirectHost) ?? client.clientId,
  };
}

export async function listMcpConnections(userId: string): Promise<McpConnectionsOverview> {
  const [records, memberships] = await Promise.all([findMcpConnections(userId), findUserMemberships(userId)]);

  const connections = records.map((record): McpConnection => {
    const { name, host } = clientName(record.client);

    return {
      clientId: record.client.clientId,
      name,
      host,
      verified: record.client.discovered,
      scopes: [...new Set(record.scopes.filter(hasScopeLabel).map((scope) => SCOPE_LABELS[scope]))],
      allDashboards: record.grant?.allDashboards ?? false,
      dashboards: grantedDashboards(record.grant, memberships)
        .map(({ dashboardId, domain }) => ({ id: dashboardId, domain }))
        .sort((a, b) => a.domain.localeCompare(b.domain)),
      connectedAt: record.connectedAt,
      lastUsedAt: record.lastUsedAt,
    };
  });

  return { connections, dashboards: grantableDashboards(memberships) };
}

/** The agent's next call is refused, even with an access token that hasn't expired. */
export async function revokeMcpConnection(userId: string, clientId: string): Promise<void> {
  const revoked = await deleteMcpConnection(userId, clientId);
  if (revoked === 0) throw await connectionNotFound();
}

/** Takes effect on the agent's next call, without reconnecting. */
export async function updateMcpConnectionDashboards(
  userId: string,
  clientId: string,
  selection: McpGrantSelection,
): Promise<void> {
  const consent = await findMcpConsentGrant(userId, clientId);
  if (!consent) throw await connectionNotFound();

  await assertPickedDashboardsAvailable(userId, selection, consent.grant);
  await replaceMcpGrant(consent.consentId, selection);
}

export async function getDashboardMcpConnections(dashboardId: string): Promise<DashboardMcpConnection[]> {
  const records = await findDashboardMcpConnections(dashboardId);
  return records.map((record) => ({
    consentId: record.consentId,
    name: clientName(record.client).name,
    member: record.member,
    connectedAt: record.connectedAt,
    lastUsedAt: record.lastUsedAt,
  }));
}

/**
 * Only this dashboard leaves the connection: the member stays connected, an All dashboards connection keeps covering
 * their other and future dashboards, and they can add it back in account settings.
 */
export async function removeDashboardFromMcpConnection(dashboardId: string, consentId: string): Promise<void> {
  if ((await removeDashboardFromMcpGrant(consentId, dashboardId)) === 0) throw await connectionNotFound();
}

/** On a password reset or change: every agent has to connect again. Personal tokens are left alone. */
export async function revokeAllMcpConnections(userId: string): Promise<void> {
  await deleteAllMcpConnections(userId);
}
