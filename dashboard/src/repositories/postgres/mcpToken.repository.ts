import prisma from '@/lib/postgres';
import { randomBytes } from 'crypto';

type McpTokenRow = {
  id: string;
  token: string;
  name: string;
  dashboardId: string;
  createdBy: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
};

function generateMcpToken(): string {
  return `btl_${randomBytes(16).toString('hex')}`;
}

export async function createMcpToken(dashboardId: string, name: string, createdBy: string): Promise<McpTokenRow> {
  const token = generateMcpToken();

  return await prisma.mcpToken.create({
    data: {
      token,
      name,
      dashboardId,
      createdBy,
    },
  });
}

export async function findMcpTokensByDashboard(dashboardId: string): Promise<McpTokenRow[]> {
  return await prisma.mcpToken.findMany({
    where: { dashboardId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteMcpToken(id: string, dashboardId: string): Promise<void> {
  await prisma.mcpToken.delete({
    where: { id, dashboardId },
  });
}
