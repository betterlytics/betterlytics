import { auth } from '@/lib/better-auth';
import { isMcpOAuthEnabled } from '@/mcp/auth/oauth';
import { withoutDpopMetadataResponse, withoutDpopProof } from '@/mcp/auth/dpop';

const TOKEN_PATH = '/oauth2/token';

/** better-auth's handler, with DPoP filtered out of the OAuth server MCP clients talk to. */
export async function handleAuthRequest(request: Request): Promise<Response> {
  if (!isMcpOAuthEnabled()) return auth.handler(request);

  const isTokenRequest = new URL(request.url).pathname.endsWith(TOKEN_PATH);
  const response = await auth.handler(isTokenRequest ? await withoutDpopProof(request) : request);
  return withoutDpopMetadataResponse(request, response);
}
