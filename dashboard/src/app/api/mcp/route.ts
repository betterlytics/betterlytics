import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { validateToken } from '@/mcp/auth/token';
import { createMcpServer } from '@/mcp/server';

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

  try {
    await validateToken(token);
  } catch {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Invalid or expired token' }, id: null },
      { status: 401 },
    );
  }

  const timezone = process.env.BETTERLYTICS_TIMEZONE ?? 'UTC';
  const server = createMcpServer(token, timezone);
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });

  await server.connect(transport);

  const response = await transport.handleRequest(req);

  req.signal.addEventListener('abort', () => {
    transport.close();
    server.close();
  });

  return response;
}

export async function GET() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405 });
}
