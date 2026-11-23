import prisma from '@/lib/postgres';
import {
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

export async function findMcpConsentGrant(userId: string, clientId: string): Promise<McpConsentGrant | null> {
  const consent = await prisma.oauthConsent.findFirst({
    where: { userId, clientId, client: ENABLED_CLIENT },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      grant: { select: { allDashboards: true, dashboards: { select: { dashboardId: true } } } },
    },
  });
  if (!consent) return null;

  return McpConsentGrantSchema.parse({
    consentId: consent.id,
    createdAt: consent.createdAt,
    grant: consent.grant && {
      allDashboards: consent.grant.allDashboards,
      dashboardIds: consent.grant.dashboards.map((row) => row.dashboardId),
    },
  });
}

export async function replaceMcpGrant(consentId: string, selection: McpGrantSelection): Promise<void> {
  const { allDashboards, dashboardIds } = McpGrantSelectionSchema.parse(selection);
  const picked = allDashboards ? [] : [...new Set(dashboardIds)];

  await prisma.$transaction(async (tx) => {
    const grant = await tx.mcpGrant.upsert({
      where: { consentId },
      create: { consentId, allDashboards },
      update: { allDashboards },
      select: { id: true },
    });
    await tx.mcpGrantDashboard.deleteMany({ where: { grantId: grant.id } });
    if (picked.length > 0) {
      await tx.mcpGrantDashboard.createMany({
        data: picked.map((dashboardId) => ({ grantId: grant.id, dashboardId })),
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
      grant: {
        select: { allDashboards: true, lastUsedAt: true, dashboards: { select: { dashboardId: true } } },
      },
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
      grant: consent.grant && {
        allDashboards: consent.grant.allDashboards,
        dashboardIds: consent.grant.dashboards.map((row) => row.dashboardId),
      },
    });
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
