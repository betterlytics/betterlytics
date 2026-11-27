import prisma from '@/lib/postgres';
import {
  CreateMcpTokenData,
  CreateMcpTokenSchema,
  DashboardMcpToken,
  DashboardMcpTokenSchema,
  McpToken,
  McpTokenCredential,
  McpTokenCredentialSchema,
  McpTokenDashboardIdsSchema,
  McpTokenSchema,
  PersonalMcpTokenRecord,
  PersonalMcpTokenRecordSchema,
} from '@/entities/dashboard/mcpToken.entities';

const TOKEN_FIELDS = { id: true, name: true, createdAt: true, lastUsedAt: true, expiresAt: true } as const;

export async function createMcpToken(data: CreateMcpTokenData, tokenHash: string): Promise<McpToken> {
  const validatedData = CreateMcpTokenSchema.parse(data);

  const row = await prisma.mcpToken.create({
    data: {
      tokenHash,
      name: validatedData.name,
      createdBy: validatedData.createdBy,
      expiresAt: validatedData.expiresAt,
      dashboards: {
        createMany: { data: [...new Set(validatedData.dashboardIds)].map((dashboardId) => ({ dashboardId })) },
      },
    },
    select: TOKEN_FIELDS,
  });

  return McpTokenSchema.parse(row);
}

/** The user's tokens, newest first, with every dashboard picked for them. */
export async function findPersonalMcpTokens(userId: string): Promise<PersonalMcpTokenRecord[]> {
  const rows = await prisma.mcpToken.findMany({
    where: { createdBy: userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { ...TOKEN_FIELDS, dashboards: { select: { dashboardId: true } } },
  });

  return rows.map(({ dashboards, ...row }) =>
    PersonalMcpTokenRecordSchema.parse({ ...row, dashboardIds: dashboards.map((d) => d.dashboardId) }),
  );
}

/** Tokens that can read the dashboard: their creator is enabled and still a member of it. */
export async function findDashboardMcpTokens(dashboardId: string): Promise<DashboardMcpToken[]> {
  const rows = await prisma.mcpToken.findMany({
    where: {
      deletedAt: null,
      dashboards: { some: { dashboardId } },
      user: {
        deletedAt: null,
        disabledAt: null,
        dashboardAccess: { some: { dashboardId, deletedAt: null } },
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { ...TOKEN_FIELDS, user: { select: { name: true, email: true } } },
  });

  return rows.map(({ user, ...row }) => DashboardMcpTokenSchema.parse({ ...row, creator: user }));
}

export async function findMcpTokenByHash(tokenHash: string): Promise<McpTokenCredential | null> {
  const row = await prisma.mcpToken.findFirst({
    where: {
      tokenHash,
      deletedAt: null,
      user: { deletedAt: null, disabledAt: null },
    },
    select: { id: true, createdBy: true, expiresAt: true, dashboards: { select: { dashboardId: true } } },
  });

  if (!row) return null;

  const { dashboards, ...token } = row;
  return McpTokenCredentialSchema.parse({ ...token, dashboardIds: dashboards.map((d) => d.dashboardId) });
}

export async function updateMcpTokenLastUsed(id: string): Promise<void> {
  await prisma.mcpToken.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
}

/** False when the user has no such token. */
export async function replaceMcpTokenDashboards(
  id: string,
  userId: string,
  dashboardIds: string[],
): Promise<boolean> {
  const picked = [...new Set(McpTokenDashboardIdsSchema.parse(dashboardIds))];

  return prisma.$transaction(async (tx) => {
    const token = await tx.mcpToken.findFirst({
      where: { id, createdBy: userId, deletedAt: null },
      select: { id: true },
    });
    if (!token) return false;

    await tx.mcpTokenDashboard.deleteMany({ where: { tokenId: id } });
    await tx.mcpTokenDashboard.createMany({ data: picked.map((dashboardId) => ({ tokenId: id, dashboardId })) });
    return true;
  });
}

/** Returns how many tokens were deleted: 0 when the user has no such token. */
export async function deletePersonalMcpToken(id: string, userId: string): Promise<number> {
  const { count } = await prisma.mcpToken.updateMany({
    where: { id, createdBy: userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return count;
}

/** Returns how many tokens lost the dashboard: 0 when no live token covers it. */
export async function removeDashboardFromMcpToken(id: string, dashboardId: string): Promise<number> {
  const { count } = await prisma.mcpTokenDashboard.deleteMany({
    where: { tokenId: id, dashboardId, token: { deletedAt: null } },
  });
  return count;
}
