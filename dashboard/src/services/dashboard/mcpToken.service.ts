'server-only';

import {
  createMcpToken,
  findMcpTokensByDashboard,
  deleteMcpToken,
} from '@/repositories/postgres/mcpToken.repository';

export async function createMcpTokenForDashboard(dashboardId: string, name: string, userId: string) {
  return await createMcpToken(dashboardId, name, userId);
}

export async function getMcpTokensForDashboard(dashboardId: string) {
  return await findMcpTokensByDashboard(dashboardId);
}

export async function removeMcpToken(id: string, dashboardId: string) {
  await deleteMcpToken(id, dashboardId);
}
