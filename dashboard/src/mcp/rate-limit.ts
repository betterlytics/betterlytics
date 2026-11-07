import type { ZodTypeAny } from 'zod';
import { isJsonContentType } from '@modelcontextprotocol/sdk/shared/mediaType.js';
import {
  CallToolRequestSchema,
  isInitializeRequest,
  isJSONRPCRequest,
  JSONRPCMessageSchema,
  SUPPORTED_PROTOCOL_VERSIONS,
} from '@modelcontextprotocol/sdk/types.js';
import { createAllOrNothingLimiter } from '@/lib/rate-limit';
import type { McpContext } from '@/mcp/context';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

// A batch over any limit is answered with one 429, so it must use no quota at all.
export const checkMcpRateLimit = createAllOrNothingLimiter(WINDOW_MS, MAX_REQUESTS);

export const OVERSIZED_BATCH_MESSAGE = `Batch has more than ${MAX_REQUESTS} calls counted against one rate limit of ${MAX_REQUESTS} a minute, so it can never be accepted. Send smaller batches.`;

export function isOversizedBatch(keys: readonly string[]): boolean {
  const counts = new Map<string, number>();
  return keys.some((key) => {
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    return count > MAX_REQUESTS;
  });
}

// A credential with one dashboard counts every request against its site, as before multi-dashboard
// support. With several, each JSON-RPC message counts against the site it can read: a call to a
// dashboard-scoped tool naming an allowed dashboardId, with arguments the tool's own schema accepts,
// counts against that site. Anything else (handshake, tools/list, describe, list_dashboards, unknown
// tools, unknown ids, invalid arguments, requests the transport rejects) counts against the credential.
export async function rateLimitKeys(
  context: McpContext,
  dashboardToolInputs: ReadonlyMap<string, ZodTypeAny>,
  req: Request,
): Promise<string[]> {
  if (context.dashboards.length === 1) return [context.dashboards[0]!.siteId];

  const body = await req
    .clone()
    .json()
    .catch(() => null);
  const messages: unknown[] = Array.isArray(body) && body.length > 0 ? body : [body];
  const dispatched = hasDispatchableHeaders(req.headers) && isDispatched(messages);
  return messages.map((message) => {
    const dashboardId = dispatched ? readableDashboardId(message, dashboardToolInputs) : undefined;
    const dashboard = context.dashboards.find((d) => d.dashboardId === dashboardId);
    return dashboard?.siteId ?? context.credentialId;
  });
}

// The headers the transport checks before it runs anything; route.test.ts holds this to the real one.
function hasDispatchableHeaders(headers: Headers): boolean {
  const accept = headers.get('accept');
  const protocolVersion = headers.get('mcp-protocol-version');
  return (
    !!accept?.includes('application/json') &&
    accept.includes('text/event-stream') &&
    isJsonContentType(headers.get('content-type')) &&
    (protocolVersion === null || SUPPORTED_PROTOCOL_VERSIONS.includes(protocolVersion))
  );
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

  // This server does not support tasks, so a task-augmented call is refused before it reaches the tool.
  const { name, arguments: args, task } = call.data.params;
  if (task) return undefined;

  return dashboardToolInputs.get(name)?.safeParse(args).success ? args?.dashboardId : undefined;
}
