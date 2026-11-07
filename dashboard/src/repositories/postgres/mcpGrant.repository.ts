import prisma from '@/lib/postgres';
import {
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

/** The user's consent for an enabled client, with the dashboards it grants. */
export async function findMcpConsentGrant(userId: string, clientId: string): Promise<McpConsentGrant | null> {
  const consent = await prisma.oauthConsent.findFirst({
    where: { userId, clientId, client: { OR: [{ disabled: false }, { disabled: null }] } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      grant: { select: { allDashboards: true, dashboards: { select: { dashboardId: true } } } },
    },
  });
  if (!consent) return null;

  return McpConsentGrantSchema.parse({
    consentId: consent.id,
    grant: consent.grant && {
      allDashboards: consent.grant.allDashboards,
      dashboardIds: consent.grant.dashboards.map((row) => row.dashboardId),
    },
  });
}

/** Replaces the consent's grant: allowing again never merges with the previous picks. */
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
