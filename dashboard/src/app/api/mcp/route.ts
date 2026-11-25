import { NextRequest } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { validateToken } from '@/mcp/auth/token';
import { validateOAuthToken } from '@/mcp/auth/oauth-token';
import { isMcpOAuthEnabled, MCP_RESOURCE_METADATA_URL } from '@/mcp/auth/oauth';
import { createMcpServer, dashboardToolNames } from '@/mcp/server';
import { checkMcpRateLimit, rateLimitKeys } from '@/mcp/rate-limit';
import { mcpRateLimitHitsTotal } from '@/mcp/metrics';

export const runtime = 'nodejs';

const MCP_REALM = 'betterlytics-mcp';
const PERSONAL_TOKEN_PREFIX = 'btl_';

const BEARER_CREDENTIALS = /^bearer\s+(\S+)\s*$/i;

/**
 * The `Bearer` scheme in any case, as HTTP and the MCP SDKs allow. A personal token may also come bare, since some
 * clients send the header value exactly as the user typed it; an OAuth access token always needs the scheme.
 */
function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')?.trim();
  if (!auth) return null;
  const bearer = BEARER_CREDENTIALS.exec(auth);
  if (bearer) return bearer[1]!;
  return auth.startsWith(PERSONAL_TOKEN_PREFIX) && !/\s/.test(auth) ? auth : null;
}

function challenge(error?: string) {
  const params = [`realm="${MCP_REALM}"`];
  if (isMcpOAuthEnabled()) params.push(`resource_metadata="${MCP_RESOURCE_METADATA_URL}"`);
  if (error) params.push('error="invalid_token"', `error_description="${error}"`);
  return `Bearer ${params.join(', ')}`;
}

function unauthorized(message: string, error?: string) {
  return Response.json(
    { jsonrpc: '2.0', error: { code: -32001, message }, id: null },
    { status: 401, headers: { 'WWW-Authenticate': challenge(error) } },
  );
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return unauthorized(
      req.headers.has('authorization')
        ? 'Authorization header must use the Bearer scheme'
        : 'Missing Authorization header',
    );
  }

  const result =
    token.startsWith(PERSONAL_TOKEN_PREFIX) || !isMcpOAuthEnabled()
      ? await validateToken(token)
      : await validateOAuthToken(token);
  if (!result.valid) {
    return unauthorized(result.reason, result.reason);
  }

  const { context } = result;

  const { allowed, retryAfterMs } = checkMcpRateLimit(await rateLimitKeys(context, dashboardToolNames(), req));
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
