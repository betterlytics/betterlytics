import 'server-only';

import type { DashboardRole } from '@prisma/client';
import type { McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';
import { UserException } from '@/lib/exceptions';
import { clientDisplayName, clientIdentityHost, urlHost } from '@/mcp/auth/client-identity';
import { MCP_READ_SCOPE } from '@/mcp/auth/oauth';
import { findUserMemberships } from '@/repositories/postgres/dashboard.repository';
import {
  deleteMcpConnections,
  findMcpConnections,
  findMcpConsentGrant,
  replaceMcpGrant,
} from '@/repositories/postgres/mcpGrant.repository';
import { assertPickedDashboardsAvailable, grantedDashboards } from '@/services/auth/mcpAccess.service';

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
  // the granted dashboards the user is still a member of
  dashboards: { id: string; domain: string }[];
  connectedAt: Date | null;
  lastUsedAt: Date | null;
};

export type McpConnectionsOverview = {
  connections: McpConnection[];
  // every dashboard the user can grant, for editing a connection
  dashboards: { id: string; domain: string; role: DashboardRole }[];
};

function hasScopeLabel(scope: string): scope is keyof typeof SCOPE_LABELS {
  return Object.hasOwn(SCOPE_LABELS, scope);
}

export async function listMcpConnections(userId: string): Promise<McpConnectionsOverview> {
  const [records, memberships] = await Promise.all([findMcpConnections(userId), findUserMemberships(userId)]);

  const connections = records.map((record): McpConnection => {
    const identityHost = clientIdentityHost(record.client);
    const redirectHost = record.client.redirectUris.length > 0 ? urlHost(record.client.redirectUris[0]!) : null;
    const host = identityHost ?? redirectHost;

    return {
      clientId: record.client.clientId,
      name: clientDisplayName(record.client.name, identityHost, redirectHost) ?? record.client.clientId,
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

  return {
    connections,
    dashboards: memberships
      .map(({ dashboardId, domain, role }) => ({ id: dashboardId, domain, role }))
      .sort((a, b) => a.domain.localeCompare(b.domain)),
  };
}

/** The agent's next call is refused, even with an access token that hasn't expired. */
export async function revokeMcpConnection(userId: string, clientId: string): Promise<void> {
  const revoked = await deleteMcpConnections(userId, clientId);
  if (revoked === 0) throw new UserException('This connection no longer exists');
}

/** Takes effect on the agent's next call, without reconnecting. */
export async function updateMcpConnectionDashboards(
  userId: string,
  clientId: string,
  selection: McpGrantSelection,
): Promise<void> {
  const consent = await findMcpConsentGrant(userId, clientId);
  if (!consent) throw new UserException('This connection no longer exists');

  await assertPickedDashboardsAvailable(userId, selection);
  await replaceMcpGrant(consent.consentId, selection);
}

/** On a password reset or change: every agent has to connect again. Personal tokens are left alone. */
export async function revokeAllMcpConnections(userId: string): Promise<void> {
  await deleteMcpConnections(userId);
}
