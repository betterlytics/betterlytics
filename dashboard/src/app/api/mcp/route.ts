import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { validateToken } from '@/mcp/auth/token';
import { createMcpServer, type McpContext } from '@/mcp/server';
import { checkRateLimit } from '@/mcp/rate-limit';

export const runtime = 'nodejs';

function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Missing Authorization header' }, id: null },
      { status: 401 },
    );
  }

  const result = await validateToken(token);
  if (!result.valid) {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32001, message: result.reason }, id: null },
      { status: 401 },
    );
  }

  const context: McpContext = { siteId: result.tokenInfo.siteId, dashboardId: result.tokenInfo.dashboardId };

  const { allowed, retryAfterMs } = checkRateLimit(context.siteId);
  if (!allowed) {
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
