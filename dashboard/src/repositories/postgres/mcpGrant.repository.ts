import prisma from '@/lib/postgres';
import {
  DashboardMcpConnectionRecord,
  DashboardMcpConnectionRecordSchema,
  McpConnectionRecord,
  McpConnectionRecordSchema,
  McpConsentGrant,
  McpConsentGrantSchema,
  McpGrantSelection,
  McpGrantSelectionSchema,
  OauthClientDetails,
  OauthClientDetailsSchema,
} from '@/entities/dashboard/mcpOAuth.entities';

export async function findOauthClient(clientId: string): Promise<OauthClientDetails | null> {
  const row = await prisma.oauthClient.findUnique({
    where: { clientId },
    select: {
      clientId: true,
      name: true,
      icon: true,
      redirectUris: true,
      clientDiscoveryId: true,
      disabled: true,
    },
  });
  if (!row) return null;

  return OauthClientDetailsSchema.parse({
    clientId: row.clientId,
    name: row.name,
    icon: row.icon,
    redirectUris: row.redirectUris,
    discovered: row.clientDiscoveryId !== null,
    disabled: row.disabled === true,
  });
}

const ENABLED_CLIENT = { OR: [{ disabled: false }, { disabled: null }] };

const GRANT_FIELDS = {
  allDashboards: true,
  dashboards: { select: { dashboardId: true } },
  excludedDashboards: { select: { dashboardId: true } },
} as const;

function grantRecord(grant: {
  allDashboards: boolean;
  dashboards: { dashboardId: string }[];
  excludedDashboards: { dashboardId: string }[];
}) {
  return {
    allDashboards: grant.allDashboards,
    dashboardIds: grant.dashboards.map((row) => row.dashboardId),
    excludedDashboardIds: grant.excludedDashboards.map((row) => row.dashboardId),
  };
}

export async function findMcpConsentGrant(userId: string, clientId: string): Promise<McpConsentGrant | null> {
  const consent = await prisma.oauthConsent.findFirst({
    where: { userId, clientId, client: ENABLED_CLIENT },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      grant: { select: GRANT_FIELDS },
    },
  });
  if (!consent) return null;

  return McpConsentGrantSchema.parse({
    consentId: consent.id,
    createdAt: consent.createdAt,
    grant: consent.grant && grantRecord(consent.grant),
  });
}

/** Under All dashboards, the selection's excluded dashboards replace the stored ones; otherwise there are none. */
export async function replaceMcpGrant(consentId: string, selection: McpGrantSelection): Promise<void> {
  const { allDashboards, dashboardIds, excludedDashboardIds = [] } = McpGrantSelectionSchema.parse(selection);
  const picked = allDashboards ? [] : [...new Set(dashboardIds)];
  const excluded = allDashboards ? [...new Set(excludedDashboardIds)] : [];

  await prisma.$transaction(async (tx) => {
    const grant = await tx.mcpGrant.upsert({
      where: { consentId },
      create: { consentId, allDashboards },
      update: { allDashboards },
      select: { id: true },
    });
    await tx.mcpGrantDashboard.deleteMany({ where: { grantId: grant.id } });
    await tx.mcpGrantExcludedDashboard.deleteMany({ where: { grantId: grant.id } });
    if (picked.length > 0) {
      await tx.mcpGrantDashboard.createMany({
        data: picked.map((dashboardId) => ({ grantId: grant.id, dashboardId })),
      });
    }
    if (excluded.length > 0) {
      await tx.mcpGrantExcludedDashboard.createMany({
        data: excluded.map((dashboardId) => ({ grantId: grant.id, dashboardId })),
      });
    }
  });
}

/** The user's connections, newest first, one per client: its latest consent, the one MCP calls are checked against. */
export async function findMcpConnections(userId: string): Promise<McpConnectionRecord[]> {
  const consents = await prisma.oauthConsent.findMany({
    where: { userId, client: ENABLED_CLIENT },
    // as findMcpConsentGrant orders them, so each row is the consent calls are checked against
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      scopes: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { clientId: true, name: true, redirectUris: true, clientDiscoveryId: true } },
      grant: { select: { ...GRANT_FIELDS, lastUsedAt: true } },
    },
  });

  const seen = new Set<string>();
  return consents.flatMap((consent) => {
    if (seen.has(consent.client.clientId)) return [];
    seen.add(consent.client.clientId);

    return McpConnectionRecordSchema.parse({
      consentId: consent.id,
      client: {
        clientId: consent.client.clientId,
        name: consent.client.name,
        redirectUris: consent.client.redirectUris,
        discovered: consent.client.clientDiscoveryId !== null,
      },
      scopes: consent.scopes,
      connectedAt: consent.updatedAt ?? consent.createdAt,
      lastUsedAt: consent.grant?.lastUsedAt ?? null,
      grant: consent.grant && grantRecord(consent.grant),
    });
  });
}

/**
 * The OAuth connections that can read the dashboard: the latest consent per member and client, as calls are checked
 * against, whose grant picks the dashboard or covers it under All dashboards without excluding it. The member is
 * enabled and still a member of the dashboard. Only the link to this dashboard is read, never the member's others.
 */
export async function findDashboardMcpConnections(dashboardId: string): Promise<DashboardMcpConnectionRecord[]> {
  const consents = await prisma.oauthConsent.findMany({
    where: {
      client: ENABLED_CLIENT,
      user: { deletedAt: null, disabledAt: null, dashboardAccess: { some: { dashboardId, deletedAt: null } } },
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { name: true, email: true } },
      client: { select: { clientId: true, name: true, redirectUris: true, clientDiscoveryId: true } },
      grant: {
        select: {
          allDashboards: true,
          lastUsedAt: true,
          dashboards: { where: { dashboardId }, select: { dashboardId: true } },
          excludedDashboards: { where: { dashboardId }, select: { dashboardId: true } },
        },
      },
    },
  });

  const seen = new Set<string>();
  return consents.flatMap((consent) => {
    const key = `${consent.userId}:${consent.client.clientId}`;
    if (seen.has(key)) return [];
    seen.add(key);

    const grant = consent.grant;
    const covers = grant?.allDashboards
      ? grant.excludedDashboards.length === 0
      : (grant?.dashboards.length ?? 0) > 0;
    if (!covers) return [];

    return DashboardMcpConnectionRecordSchema.parse({
      consentId: consent.id,
      client: {
        clientId: consent.client.clientId,
        name: consent.client.name,
        redirectUris: consent.client.redirectUris,
        discovered: consent.client.clientDiscoveryId !== null,
      },
      member: consent.user,
      connectedAt: consent.updatedAt ?? consent.createdAt,
      lastUsedAt: grant?.lastUsedAt ?? null,
    });
  });
}

/**
 * Takes the dashboard out of the connection's grant, leaving the consent and its other dashboards: an All
 * dashboards grant excludes it and keeps covering the rest, a picked one drops it. Only for a consent of a member
 * of the dashboard. Returns how many grants no longer cover the dashboard: 0 when the consent has none, or a picked
 * one that didn't name it. An All dashboards grant that already excluded it counts, so a second remove succeeds.
 */
export async function removeDashboardFromMcpGrant(consentId: string, dashboardId: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const grant = await tx.mcpGrant.findFirst({
      where: {
        consentId,
        consent: { user: { dashboardAccess: { some: { dashboardId, deletedAt: null } } } },
      },
      select: { id: true, allDashboards: true },
    });
    if (!grant) return 0;

    if (!grant.allDashboards) {
      const { count } = await tx.mcpGrantDashboard.deleteMany({ where: { grantId: grant.id, dashboardId } });
      return count;
    }
    await tx.mcpGrantExcludedDashboard.createMany({
      data: [{ grantId: grant.id, dashboardId }],
      skipDuplicates: true,
    });
    return 1;
  });
}

export async function touchMcpGrantLastUsed(consentId: string): Promise<void> {
  await prisma.mcpGrant.updateMany({ where: { consentId }, data: { lastUsedAt: new Date() } });
}

/**
 * Deletes the user's consents for the client with their stored tokens, and returns how many consents went. MCP access
 * tokens are JWTs that are never stored: resolveOAuthMcpContext refuses those against the consent instead.
 */
export async function deleteMcpConnection(userId: string, clientId: string): Promise<number> {
  return deleteConsentsWithTokens({ userId, clientId });
}

export async function deleteAllMcpConnections(userId: string): Promise<number> {
  return deleteConsentsWithTokens({ userId });
}

async function deleteConsentsWithTokens(where: { userId: string; clientId?: string }): Promise<number> {
  return prisma.$transaction(async (tx) => {
    await tx.oauthAccessToken.deleteMany({ where });
    await tx.oauthRefreshToken.deleteMany({ where });
    const { count } = await tx.oauthConsent.deleteMany({ where });
    return count;
  });
}
