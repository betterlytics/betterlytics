import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { validateToken } from '@/mcp/auth/token';
import { createMcpServer, type McpContext } from '@/mcp/server';
import { checkRateLimit } from '@/mcp/rate-limit';
import { mcpRateLimitHitsTotal } from '@/mcp/metrics';

export const runtime = 'nodejs';

const MCP_REALM = 'betterlytics-mcp';

function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function unauthorized(message: string, challenge: string) {
  return Response.json(
    { jsonrpc: '2.0', error: { code: -32001, message }, id: null },
    { status: 401, headers: { 'WWW-Authenticate': challenge } },
  );
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) {
    return unauthorized('Missing Authorization header', `Bearer realm="${MCP_REALM}"`);
  }

  const result = await validateToken(token);
  if (!result.valid) {
    return unauthorized(
      result.reason,
      `Bearer realm="${MCP_REALM}", error="invalid_token", error_description="${result.reason}"`,
    );
  }

  const context: McpContext = { siteId: result.tokenInfo.siteId, dashboardId: result.tokenInfo.dashboardId };

  const { allowed, retryAfterMs } = checkRateLimit(context.siteId);
  if (!allowed) {
    mcpRateLimitHitsTotal.inc();
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32005, message: 'Rate limit exceeded' }, id: null },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const server = createMcpServer(context);
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });

  try {
    await server.connect(transport);
    return await transport.handleRequest(req);
  } finally {
    await transport.close();
    await server.close();
  }
}

export async function GET() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
