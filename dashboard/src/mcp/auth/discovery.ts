import { handleAuthRequest } from '@/mcp/auth/auth-handler';
import { isMcpOAuthEnabled } from '@/mcp/auth/oauth';

type DiscoveryParams = { params: Promise<{ path?: string[] }> };

/**
 * A discovery document at the site root, served by the OAuth plugins. `paths` are the accepted suffixes, each
 * mapped to the path the plugins answer on. Cloud only: self-host has no OAuth, so these are 404s.
 */
export function discoveryRoute(paths: Record<string, string>) {
  return async (request: Request, { params }: DiscoveryParams): Promise<Response> => {
    const suffix = (await params).path?.join('/') ?? '';
    const target = Object.hasOwn(paths, suffix) ? paths[suffix] : undefined;
    if (!isMcpOAuthEnabled() || target === undefined) {
      return new Response('Not Found', { status: 404 });
    }
    return handleAuthRequest(
      new Request(new URL(target, request.url), { method: request.method, headers: request.headers }),
    );
  };
}
