import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createSlidingWindowLimiter, type RateLimitResult } from '@/lib/rate-limit';
import type { McpContext } from '@/mcp/context';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const checkKey = createSlidingWindowLimiter(WINDOW_MS, MAX_REQUESTS);

export function checkMcpRateLimit(keys: readonly string[]): RateLimitResult {
  for (const key of keys) {
    const result = checkKey(key);
    if (!result.allowed) return result;
  }
  return { allowed: true, retryAfterMs: 0 };
}

// A credential with one dashboard counts every request against its site, as before multi-dashboard
// support. With several, each message counts against the site of the allowed dashboard it names in a
// call to a dashboard tool, and anything else counts against the credential.
export async function rateLimitKeys(
  context: McpContext,
  dashboardTools: ReadonlySet<string>,
  req: Request,
): Promise<string[]> {
  if (context.dashboards.length === 1) return [context.dashboards[0]!.siteId];

  const body = await req
    .clone()
    .json()
    .catch(() => null);
  const messages: unknown[] = Array.isArray(body) && body.length > 0 ? body : [body];
  return messages.map((message) => {
    const dashboardId = namedDashboardId(message, dashboardTools);
    const dashboard = context.dashboards.find((d) => d.dashboardId === dashboardId);
    return dashboard?.siteId ?? context.credentialId;
  });
}

function namedDashboardId(message: unknown, dashboardTools: ReadonlySet<string>): unknown {
  const call = CallToolRequestSchema.safeParse(message);
  if (!call.success || !dashboardTools.has(call.data.params.name)) return undefined;
  return call.data.params.arguments?.dashboardId;
}
