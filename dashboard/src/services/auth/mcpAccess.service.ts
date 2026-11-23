import 'server-only';

import type {
  DashboardMembership,
  McpConsentGrant,
  McpGrantSelection,
} from '@/entities/dashboard/mcpOAuth.entities';
import { UserException } from '@/lib/exceptions';
import type { McpContext, McpDashboard } from '@/mcp/context';
import { findUserMemberships } from '@/repositories/postgres/dashboard.repository';
import { findMcpConsentGrant, touchMcpGrantLastUsed } from '@/repositories/postgres/mcpGrant.repository';
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

  try {
    await touchMcpGrantLastUsed(consent.consentId);
  } catch (error) {
    console.error('Failed to record MCP connection use:', { consentId: consent.consentId, error });
  }

  return {
    credentialId: `oauth-consent:${consent.consentId}`,
    dashboards: grantedDashboards(consent.grant, memberships),
  };
}

/** Every picked dashboard is checked against the user's memberships now, not as the page showed them. */
export async function assertPickedDashboardsAvailable(
  userId: string,
  selection: McpGrantSelection,
): Promise<void> {
  if (selection.allDashboards) return;
  const memberOf = new Set((await findUserMemberships(userId)).map((membership) => membership.dashboardId));
  if (selection.dashboardIds.some((dashboardId) => !memberOf.has(dashboardId))) {
    throw new UserException('One of the picked dashboards is no longer available');
  }
}
