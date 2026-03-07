import { findMcpTokenByHash, updateMcpTokenLastUsed } from '@/repositories/postgres/mcpToken.repository';
import { hashToken as hashMcpToken } from '@/services/dashboard/mcpToken.service';

type TokenInfo = {
  siteId: string;
  dashboardId: string;
};

type ValidateTokenResult =
  | { valid: true; tokenInfo: TokenInfo }
  | { valid: false; reason: string };

export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const tokenHash = hashMcpToken(token);
  const mcpToken = await findMcpTokenByHash(tokenHash);

  if (!mcpToken) {
    return { valid: false, reason: 'Invalid MCP token' };
  }

  if (mcpToken.expiresAt && mcpToken.expiresAt < new Date()) {
    return { valid: false, reason: 'MCP token has expired' };
  }

  await updateMcpTokenLastUsed(mcpToken.id);

  return {
    valid: true,
    tokenInfo: {
      siteId: mcpToken.dashboard.siteId,
      dashboardId: mcpToken.dashboardId,
    },
  };
}
