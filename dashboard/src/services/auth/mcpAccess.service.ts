import 'server-only';

import type {
  DashboardMembership,
  McpConsentGrant,
  McpGrantSelection,
} from '@/entities/dashboard/mcpOAuth.entities';
import { getTranslations } from 'next-intl/server';
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

/** Every dashboard the user can grant, by domain: what the consent page and the edit dialog pick from. */
export function grantableDashboards(
  memberships: DashboardMembership[],
): { id: string; domain: string; role: DashboardMembership['role'] }[] {
  return memberships
    .map(({ dashboardId, domain, role }) => ({ id: dashboardId, domain, role }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

/**
 * Checked on every MCP call, so a deleted or disabled user, a revoked consent or a left dashboard takes effect
 * before the access token expires. Null when the connection no longer authorizes anything.
 * `issuedAt` is the token's `iat` in seconds: access tokens aren't stored, so a token issued before a revoke would
 * otherwise work again once the client reconnects.
 */
export async function resolveOAuthMcpContext(
  userId: string,
  clientId: string,
  issuedAt: number,
): Promise<McpContext | null> {
  const [user, consent, memberships] = await Promise.all([
    findUserById(userId),
    findMcpConsentGrant(userId, clientId),
    findUserMemberships(userId),
  ]);
  if (!user || user.deletedAt || user.disabledAt || !consent) return null;
  // better-auth stamps the consent's createdAt to the second, like iat
  if (consent.createdAt && issuedAt < Math.floor(consent.createdAt.getTime() / 1000)) return null;

  // not awaited, so the call doesn't wait on the write, and a failed write doesn't fail it
  touchMcpGrantLastUsed(consent.consentId).catch((error) => {
    console.error('Failed to record MCP connection use:', { consentId: consent.consentId, error });
  });

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
    const t = await getTranslations('validation.mcpConnections');
    throw new UserException(t('dashboardUnavailable'));
  }
}
