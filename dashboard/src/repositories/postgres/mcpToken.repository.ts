import prisma from '@/lib/postgres';
import { createHash, randomBytes } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateMcpToken(): string {
  return `btl_${randomBytes(16).toString('hex')}`;
}

export async function createMcpToken(dashboardId: string, name: string, createdBy: string) {
  const plainToken = generateMcpToken();
  const tokenHash = hashToken(plainToken);

  const row = await prisma.mcpToken.create({
    data: {
      tokenHash,
      name,
      dashboardId,
      createdBy,
    },
  });

  return { ...row, plainToken };
}

export async function findMcpTokensByDashboard(dashboardId: string) {
  return await prisma.mcpToken.findMany({
    where: { dashboardId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findMcpTokenByHash(token: string) {
  const tokenHash = hashToken(token);

  return await prisma.mcpToken.findUnique({
    where: { tokenHash },
    include: { dashboard: true },
  });
}

export async function updateMcpTokenLastUsed(id: string) {
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
