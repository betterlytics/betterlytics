import type { ZodTypeAny } from 'zod';
import {
  CallToolRequestSchema,
  isInitializeRequest,
  isJSONRPCRequest,
  JSONRPCMessageSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createAllOrNothingLimiter } from '@/lib/rate-limit';
import type { McpContext } from '@/mcp/context';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

// A batch over any limit is answered with one 429, so it must use no quota at all.
export const checkMcpRateLimit = createAllOrNothingLimiter(WINDOW_MS, MAX_REQUESTS);

// A credential with one dashboard counts every request against its site, as before multi-dashboard
// support. With several, each JSON-RPC message counts against the site it can read: a call to a
// dashboard-scoped tool naming an allowed dashboardId, with arguments the tool's own schema accepts,
// counts against that site. Anything else (handshake, tools/list, describe, list_dashboards, unknown
// tools, unknown ids, invalid arguments, requests the transport rejects) counts against the credential.
export async function rateLimitKeys(
  context: McpContext,
  dashboardToolInputs: ReadonlyMap<string, ZodTypeAny>,
  readBody: () => Promise<unknown>,
): Promise<string[]> {
  if (context.dashboards.length === 1) return [context.dashboards[0]!.siteId];

  const body = await readBody().catch(() => null);
  const messages: unknown[] = Array.isArray(body) && body.length > 0 ? body : [body];
  const dispatched = isDispatched(messages);
  return messages.map((message) => {
    const dashboardId = dispatched ? readableDashboardId(message, dashboardToolInputs) : undefined;
    const dashboard = context.dashboards.find((d) => d.dashboardId === dashboardId);
    return dashboard?.siteId ?? context.credentialId;
  });
}

// One malformed message, or an initialize sharing a batch, makes the transport reject every message.
function isDispatched(messages: unknown[]): boolean {
  if (!messages.every((message) => JSONRPCMessageSchema.safeParse(message).success)) return false;
  return messages.length === 1 || !messages.some(isInitializeRequest);
}

function readableDashboardId(message: unknown, dashboardToolInputs: ReadonlyMap<string, ZodTypeAny>): unknown {
  if (!isJSONRPCRequest(message)) return undefined;
  const call = CallToolRequestSchema.safeParse(message);
  if (!call.success) return undefined;

  const { name, arguments: args } = call.data.params;
  return dashboardToolInputs.get(name)?.safeParse(args).success ? args?.dashboardId : undefined;
}
