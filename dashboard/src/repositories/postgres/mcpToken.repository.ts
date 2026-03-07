import prisma from '@/lib/postgres';
import {
  McpTokenListItem,
  McpTokenListItemSchema,
  McpTokenWithDashboard,
  McpTokenWithDashboardSchema,
  CreateMcpTokenData,
  CreateMcpTokenSchema,
} from '@/entities/dashboard/mcpToken.entities';

export async function createMcpToken(
  data: CreateMcpTokenData,
  tokenHash: string,
): Promise<McpTokenListItem> {
  const validatedData = CreateMcpTokenSchema.parse(data);

  const row = await prisma.mcpToken.create({
    data: {
      tokenHash,
      name: validatedData.name,
      dashboardId: validatedData.dashboardId,
      createdBy: validatedData.createdBy,
    },
    omit: { tokenHash: true, expiresAt: true, createdBy: true },
  });

  return McpTokenListItemSchema.parse(row);
}

export async function findMcpTokensByDashboard(dashboardId: string): Promise<McpTokenListItem[]> {
  const rows = await prisma.mcpToken.findMany({
    where: { dashboardId },
    orderBy: { createdAt: 'desc' },
    omit: { tokenHash: true, expiresAt: true, createdBy: true },
  });

  return rows.map((row) => McpTokenListItemSchema.parse(row));
}

export async function findMcpTokenByHash(tokenHash: string): Promise<McpTokenWithDashboard | null> {
  const row = await prisma.mcpToken.findUnique({
    where: { tokenHash },
    include: { dashboard: true },
  });

  if (!row) return null;

  return McpTokenWithDashboardSchema.parse(row);
}

export async function updateMcpTokenLastUsed(id: string): Promise<void> {
  await prisma.mcpToken.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });
}

export async function deleteMcpToken(id: string, dashboardId: string): Promise<void> {
  await prisma.mcpToken.delete({
    where: { id, dashboardId },
  });
}
