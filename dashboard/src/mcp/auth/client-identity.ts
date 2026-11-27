import type { OauthClientDetails } from '@/entities/dashboard/mcpOAuth.entities';

export function urlHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

/** The host that vouches for a CIMD client: its client_id URL's. DCR clients name themselves, so they have none. */
export function clientIdentityHost(client: Pick<OauthClientDetails, 'clientId' | 'discovered'>): string | null {
  return client.discovered ? urlHost(client.clientId) : null;
}

/** The client's own name, or the host it is known by when it registered without one. */
export function clientDisplayName(name: string | null, identityHost: string | null, redirectHost: string | null) {
  return name?.trim() || identityHost || redirectHost;
}
