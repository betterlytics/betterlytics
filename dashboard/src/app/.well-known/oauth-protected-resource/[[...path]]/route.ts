import { discoveryRoute } from '@/mcp/auth/discovery';

export const runtime = 'nodejs';

// RFC 9728: the bare path and the one suffixed with the MCP endpoint's path
const handler = discoveryRoute({
  '': '/.well-known/oauth-protected-resource',
  'api/mcp': '/.well-known/oauth-protected-resource/api/mcp',
});

export { handler as GET, handler as HEAD };
