import { findMcpTokenByHash } from '@/repositories/postgres/mcpToken.repository';
import { hashToken as hashMcpToken } from '@/services/dashboard/mcpToken.service';
import { resolveTokenMcpContext } from '@/services/auth/mcpAccess.service';
import type { McpContext } from '@/mcp/context';

type ValidateTokenResult = { valid: true; context: McpContext } | { valid: false; reason: string };

export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const tokenHash = hashMcpToken(token);
  const mcpToken = await findMcpTokenByHash(tokenHash);

  if (!mcpToken) {
    return { valid: false, reason: 'Invalid MCP token' };
  }

  if (mcpToken.expiresAt && mcpToken.expiresAt < new Date()) {
    return { valid: false, reason: 'MCP token has expired' };
  }

  return { valid: true, context: await resolveTokenMcpContext(mcpToken) };
}
