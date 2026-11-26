import { verifyJwsAccessToken } from 'better-auth/oauth2';
import { auth } from '@/lib/better-auth';
import { MCP_OAUTH_ISSUER, MCP_READ_SCOPE, MCP_RESOURCE } from '@/mcp/auth/oauth';
import { resolveOAuthMcpContext } from '@/services/auth/mcpAccess.service';
import type { McpContext } from '@/mcp/context';

// Keys come straight from our own database rather than over HTTP; this object keys the library's JWKS cache
const jwksCacheKey = {};

async function verifiedClaims(token: string): Promise<{ userId: string; clientId: string } | null> {
  try {
    const payload = await verifyJwsAccessToken(token, {
      jwksFetch: () => auth.api.getJwks(),
      jwksCacheKey,
      verifyOptions: { issuer: MCP_OAUTH_ISSUER, audience: MCP_RESOURCE, typ: 'at+jwt' },
    });
    const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];
    // A sender-constrained (DPoP) token needs its proof checked, which this endpoint doesn't do, so it isn't taken
    // as a plain bearer token
    if (!scopes.includes(MCP_READ_SCOPE) || payload.cnf !== undefined) return null;
    if (typeof payload.sub !== 'string' || typeof payload.azp !== 'string') return null;
    return { userId: payload.sub, clientId: payload.azp };
  } catch {
    return null;
  }
}

type ValidateOAuthTokenResult = { valid: true; context: McpContext } | { valid: false; reason: string };

/** An OAuth access token: its signature, issuer, audience and expiry, then the live grant behind it. */
export async function validateOAuthToken(token: string): Promise<ValidateOAuthTokenResult> {
  const claims = await verifiedClaims(token);
  if (!claims) return { valid: false, reason: 'Invalid access token' };

  const context = await resolveOAuthMcpContext(claims.userId, claims.clientId);
  if (!context) return { valid: false, reason: 'Access has been revoked' };

  return { valid: true, context };
}
