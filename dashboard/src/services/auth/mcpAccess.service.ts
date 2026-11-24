import 'server-only';

import type { DashboardMembership, McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';
import { getTranslations } from 'next-intl/server';
import { UserException } from '@/lib/exceptions';
import type { McpContext, McpDashboard } from '@/mcp/context';
import { findUserMemberships } from '@/repositories/postgres/dashboard.repository';
import { findMcpConsentGrant, touchMcpGrantLastUsed } from '@/repositories/postgres/mcpGrant.repository';
import { updateMcpTokenLastUsed } from '@/repositories/postgres/mcpToken.repository';
import type { McpTokenCredential } from '@/entities/dashboard/mcpToken.entities';
import { findUserById } from '@/repositories/postgres/user.repository';

type Grant = { allDashboards: boolean; dashboardIds: string[]; excludedDashboardIds?: string[] };

/**
 * The granted dashboards the user is still a member of, with their current role: the picked ones, or all of the
 * user's under All dashboards, which includes the ones joined or created after connecting, but not the ones an
 * owner or admin removed. Includes dashboards whose AI access is off, which the grant keeps for when it is back on.
 */
export function grantedDashboards(grant: Grant | null, memberships: DashboardMembership[]): DashboardMembership[] {
  if (!grant) return [];
  const picked = new Set(grant.dashboardIds);
  const excluded = new Set(grant.excludedDashboardIds ?? []);
  return memberships.filter((membership) =>
    grant.allDashboards ? !excluded.has(membership.dashboardId) : picked.has(membership.dashboardId),
  );
}

/** What a call may read: the granted dashboards with AI access on. The others are named only to refuse them. */
function mcpContext(credentialId: string, granted: DashboardMembership[]): McpContext {
  return {
    credentialId,
    dashboards: granted
      .filter((dashboard) => dashboard.aiAccessEnabled)
      .map(({ dashboardId, siteId, domain, role }): McpDashboard => ({ dashboardId, siteId, domain, role })),
    aiAccessDisabledDashboardIds: granted
      .filter((dashboard) => !dashboard.aiAccessEnabled)
      .map((dashboard) => dashboard.dashboardId),
  };
}

/** Every dashboard the user can grant, by domain: what the consent page and the edit dialog pick from. */
export function grantableDashboards(memberships: DashboardMembership[]): {
  id: string;
  domain: string;
  role: DashboardMembership['role'];
  aiAccessEnabled: boolean;
}[] {
  return memberships
    .map(({ dashboardId, domain, role, aiAccessEnabled }) => ({ id: dashboardId, domain, role, aiAccessEnabled }))
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

  return mcpContext(`oauth-consent:${consent.consentId}`, grantedDashboards(consent.grant, memberships));
}

/**
 * A personal token acts as its creator, like an OAuth connection with picked dashboards: each call reads only the
 * picked dashboards the creator is still a member of, with their current role. The repository has already refused
 * a token whose creator is deleted or disabled.
 */
export async function resolveTokenMcpContext(token: McpTokenCredential): Promise<McpContext> {
  const [memberships] = await Promise.all([
    findUserMemberships(token.createdBy),
    updateMcpTokenLastUsed(token.id),
  ]);

  return mcpContext(
    `mcp-token:${token.id}`,
    grantedDashboards({ allDashboards: false, dashboardIds: token.dashboardIds }, memberships),
  );
}

/**
 * Every picked dashboard is checked against the user's memberships now, not as the page showed them. A dashboard
 * with AI access off can't be newly picked, but one the credential already grants stays, so turning AI access back
 * on restores it.
 */
export async function assertPickedDashboardsAvailable(
  userId: string,
  selection: McpGrantSelection,
  current: Grant | null = null,
): Promise<void> {
  if (selection.allDashboards) return;
  const memberships = await findUserMemberships(userId);
  const memberOf = new Map(memberships.map((membership) => [membership.dashboardId, membership]));
  const alreadyGranted = new Set(
    grantedDashboards(current, memberships).map((dashboard) => dashboard.dashboardId),
  );

  const t = await getTranslations('validation.mcpConnections');
  for (const dashboardId of selection.dashboardIds) {
    const membership = memberOf.get(dashboardId);
    if (!membership) throw new UserException(t('dashboardUnavailable'));
    if (!membership.aiAccessEnabled && !alreadyGranted.has(dashboardId)) {
      throw new UserException(t('aiAccessDisabled', { domain: membership.domain }));
    }
  }
}
