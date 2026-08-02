'server-only';

import { createHash, randomBytes } from 'crypto';
import {
  createMcpToken,
  findMcpTokensByDashboard,
  deleteMcpToken,
} from '@/repositories/postgres/mcpToken.repository';
import { MCP_TOKEN_LIFETIME_DAYS, McpTokenLifetime } from '@/entities/dashboard/mcpToken.entities';

function generateMcpToken(): string {
  return `btl_${randomBytes(16).toString('hex')}`;
}

function expiresAtFromLifetime(lifetime: McpTokenLifetime): Date | null {
  if (lifetime === 'never') return null;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + MCP_TOKEN_LIFETIME_DAYS[lifetime]);
  return expiresAt;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createMcpTokenForDashboard(
  dashboardId: string,
  name: string,
  userId: string,
  lifetime: McpTokenLifetime,
) {
  const plainToken = generateMcpToken();
  const tokenHash = hashToken(plainToken);
  const row = await createMcpToken(
    { dashboardId, name, createdBy: userId, expiresAt: expiresAtFromLifetime(lifetime) },
    tokenHash,
  );
  return { ...row, plainToken };
}

export async function getMcpTokensForDashboard(dashboardId: string) {
  return await findMcpTokensByDashboard(dashboardId);
}

export async function removeMcpToken(id: string, dashboardId: string) {
  await deleteMcpToken(id, dashboardId);
}
