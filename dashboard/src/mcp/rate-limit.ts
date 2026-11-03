import { createSlidingWindowLimiter, type RateLimitResult } from '@/lib/rate-limit';
import type { McpContext } from '@/mcp/context';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const checkRateLimit = createSlidingWindowLimiter(WINDOW_MS, MAX_REQUESTS);

// A credential with one dashboard counts every request against its site, as before multi-dashboard
// support. With several, each JSON-RPC message counts against the site it reads: a call to a
// dashboard-scoped tool naming an allowed dashboardId counts against that site, anything else (handshake,
// tools/list, describe, list_dashboards, unknown tools, unknown ids) against the credential.
export async function rateLimitKeys(
  context: McpContext,
  dashboardToolNames: ReadonlySet<string>,
  readBody: () => Promise<unknown>,
): Promise<string[]> {
  if (context.dashboards.length === 1) return [context.dashboards[0]!.siteId];

  const body = await readBody().catch(() => null);
  const messages = Array.isArray(body) && body.length > 0 ? body : [body];
  return messages.map((message) => {
    const dashboardId = toolCallDashboardId(message, dashboardToolNames);
    const dashboard = context.dashboards.find((d) => d.dashboardId === dashboardId);
    return dashboard?.siteId ?? context.credentialId;
  });
}

function toolCallDashboardId(message: unknown, dashboardToolNames: ReadonlySet<string>): unknown {
  if (typeof message !== 'object' || message === null) return undefined;
  const { method, params } = message as {
    method?: unknown;
    params?: { name?: unknown; arguments?: { dashboardId?: unknown } };
  };
  if (method !== 'tools/call' || !dashboardToolNames.has(params?.name as string)) return undefined;
  return params?.arguments?.dashboardId;
}

export function checkMcpRateLimit(keys: string[]): RateLimitResult {
  for (const key of keys) {
    const result = checkRateLimit(key);
    if (!result.allowed) return result;
  }
  return { allowed: true, retryAfterMs: 0 };
}
