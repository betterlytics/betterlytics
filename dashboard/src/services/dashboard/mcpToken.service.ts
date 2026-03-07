'server-only';

import { createHash, randomBytes } from 'crypto';
import {
  createMcpToken,
  findMcpTokensByDashboard,
  deleteMcpToken,
} from '@/repositories/postgres/mcpToken.repository';

function generateMcpToken(): string {
  return `btl_${randomBytes(16).toString('hex')}`;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createMcpTokenForDashboard(dashboardId: string, name: string, userId: string) {
  const plainToken = generateMcpToken();
  const tokenHash = hashToken(plainToken);
  const row = await createMcpToken({ dashboardId, name, createdBy: userId }, tokenHash);
  return { ...row, plainToken };
}

export async function getMcpTokensForDashboard(dashboardId: string) {
  return await findMcpTokensByDashboard(dashboardId);
}

export async function removeMcpToken(id: string, dashboardId: string) {
  await deleteMcpToken(id, dashboardId);
}
