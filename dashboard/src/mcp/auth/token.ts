import { PrismaClient } from '@prisma/client';

type TokenInfo = {
  siteId: string;
  dashboardId: string;
  userId: string;
};

const prisma = new PrismaClient();

export async function validateToken(token: string): Promise<TokenInfo> {
  const mcpToken = await prisma.mcpToken.findUnique({
    where: { token },
    include: { dashboard: true },
  });

  if (!mcpToken) {
    throw new Error('Invalid MCP token');
  }

  if (mcpToken.expiresAt && mcpToken.expiresAt < new Date()) {
    throw new Error('MCP token has expired');
  }

  await prisma.mcpToken.update({
    where: { id: mcpToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    siteId: mcpToken.dashboard.siteId,
    dashboardId: mcpToken.dashboardId,
    userId: mcpToken.createdBy,
  };
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
