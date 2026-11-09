import { MCP_RESOURCE } from '@/mcp/auth/oauth';

function words(value: unknown): string[] | null {
  return typeof value === 'string' ? value.split(' ').filter(Boolean) : null;
}

/** What every authorization request gets before the OAuth provider sees it. */
export function withMcpAuthorizationDefaults(params: Record<string, unknown>): Record<string, unknown> {
  const prompt = words(params.prompt) ?? [];
  const scope = words(params.scope);
  return {
    ...params,
    // Consent shows on every connect, so reconnecting can change the dashboards. A prompt=none request asks for no
    // page at all and is left to the library, which only answers it silently while the consent still exists.
    ...(prompt.includes('none') || prompt.includes('consent') ? {} : { prompt: [...prompt, 'consent'].join(' ') }),
    // A connection lasts while it is used, which takes a refresh token, and those need offline_access. Clients
    // that only ask for the scopes in our resource metadata leave it out. Without a scope the client's registered
    // scopes apply, which include it.
    ...(scope && !scope.includes('offline_access') ? { scope: [...scope, 'offline_access'].join(' ') } : {}),
    // Without a resource the library issues an opaque token, and the MCP endpoint only takes JWTs bound to it
    ...(params.resource === undefined ? { resource: MCP_RESOURCE } : {}),
  };
}
