import { discoveryRoute } from '@/mcp/auth/discovery';

export const runtime = 'nodejs';

// RFC 8414 puts the metadata under the issuer's path (/api/auth). Clients from before protected resource
// metadata look at the bare path, so it serves the same document.
const handler = discoveryRoute({
  '': '/.well-known/oauth-authorization-server/api/auth',
  'api/auth': '/.well-known/oauth-authorization-server/api/auth',
});

export { handler as GET, handler as HEAD };
