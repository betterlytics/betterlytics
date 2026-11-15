import 'server-only';

import type { DashboardMembership, McpConsentGrant } from '@/entities/dashboard/mcpOAuth.entities';
import type { McpContext, McpDashboard } from '@/mcp/context';
import { findUserMemberships } from '@/repositories/postgres/dashboard.repository';
import { findMcpConsentGrant } from '@/repositories/postgres/mcpGrant.repository';
import { findUserById } from '@/repositories/postgres/user.repository';

/**
 * The granted dashboards the user can still read, with their current role: the picked ones, or all of the
 * user's under All dashboards, which includes the ones joined or created after connecting.
 */
export function grantedDashboards(
  grant: McpConsentGrant['grant'],
  memberships: DashboardMembership[],
): McpDashboard[] {
  if (!grant) return [];
  const picked = new Set(grant.dashboardIds);
  return memberships
    .filter((membership) => grant.allDashboards || picked.has(membership.dashboardId))
    .map(({ dashboardId, siteId, domain, role }) => ({ dashboardId, siteId, domain, role }));
}

/**
 * Checked on every MCP call, so a deleted or disabled user, a revoked consent or a left dashboard takes effect
 * before the access token expires. Null when the connection no longer authorizes anything.
 */
export async function resolveOAuthMcpContext(userId: string, clientId: string): Promise<McpContext | null> {
  const [user, consent, memberships] = await Promise.all([
    findUserById(userId),
    findMcpConsentGrant(userId, clientId),
    findUserMemberships(userId),
  ]);
  if (!user || user.deletedAt || user.disabledAt || !consent) return null;

  return {
    credentialId: `oauth-consent:${consent.consentId}`,
    dashboards: grantedDashboards(consent.grant, memberships),
  };
}
