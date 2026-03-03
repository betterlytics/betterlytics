import { findMcpTokenByHash, updateMcpTokenLastUsed } from '@/repositories/postgres/mcpToken.repository';

type TokenInfo = {
  siteId: string;
  dashboardId: string;
  userId: string;
};

export async function validateToken(token: string): Promise<TokenInfo> {
  const mcpToken = await findMcpTokenByHash(token);

  if (!mcpToken) {
    throw new Error('Invalid MCP token');
  }

  if (mcpToken.expiresAt && mcpToken.expiresAt < new Date()) {
    throw new Error('MCP token has expired');
  }

  await updateMcpTokenLastUsed(mcpToken.id);

  return {
    siteId: mcpToken.dashboard.siteId,
    dashboardId: mcpToken.dashboardId,
    userId: mcpToken.createdBy,
  };
}
