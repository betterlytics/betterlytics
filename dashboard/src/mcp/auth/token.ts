import { findMcpTokenByHash, updateMcpTokenLastUsed } from '@/repositories/postgres/mcpToken.repository';
import { findUserDashboardOrNull } from '@/repositories/postgres/dashboard.repository';
import { hashToken as hashMcpToken } from '@/services/dashboard/mcpToken.service';
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

  const [membership] = await Promise.all([
    findUserDashboardOrNull({ userId: mcpToken.createdBy, dashboardId: mcpToken.dashboardId }),
    updateMcpTokenLastUsed(mcpToken.id),
  ]);

  return {
    valid: true,
    context: {
      credentialId: `mcp-token:${mcpToken.id}`,
      dashboards: [
        {
          dashboardId: mcpToken.dashboardId,
          siteId: mcpToken.dashboard.siteId,
          domain: mcpToken.dashboard.domain,
          role: membership?.role ?? null,
        },
      ],
    },
  };
}
