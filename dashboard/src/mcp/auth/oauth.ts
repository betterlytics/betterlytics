import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { isLoopbackHost } from '@/mcp/auth/redirect-uri';

/** The one scope for now; future write scopes are named after the #60 families. */
export const MCP_READ_SCOPE = 'dashboards:read';

export const MCP_RESOURCE = `${env.PUBLIC_BASE_URL}/api/mcp`;
// better-auth's issuer is its base URL, which includes the /api/auth base path
export const MCP_OAUTH_ISSUER = `${env.AUTH_URL}/api/auth`;
export const MCP_RESOURCE_METADATA_URL = `${env.PUBLIC_BASE_URL}/.well-known/oauth-protected-resource/api/mcp`;
export const MCP_CONSENT_PATH = '/consent';

// The OAuth library refuses a resource URL that is neither HTTPS nor loopback, so a dev stack served from a
// `*.localhost` subdomain keeps OAuth off instead of failing to start.
function isAcceptedResourceUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' || (protocol === 'http:' && isLoopbackHost(hostname));
  } catch {
    return false;
  }
}

const enabled = isFeatureEnabled('isCloud') && isAcceptedResourceUrl(MCP_RESOURCE);
if (isFeatureEnabled('isCloud') && !enabled) {
  console.warn(`MCP OAuth is off: ${MCP_RESOURCE} is neither HTTPS nor a loopback URL`);
}

/** OAuth for MCP clients is cloud only; self-host keeps `btl_` tokens alone. */
export function isMcpOAuthEnabled(): boolean {
  return enabled;
}
