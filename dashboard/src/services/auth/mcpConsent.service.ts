import 'server-only';

import { createHash } from 'node:crypto';
import { verifyOAuthQueryParams } from '@better-auth/oauth-provider';
import type { DashboardRole } from '@prisma/client';
import type { McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';
import { MCP_CONSENT_REQUEST_INVALID } from '@/constants/auth';
import { auth } from '@/lib/better-auth';
import { env } from '@/lib/env';
import { UserException } from '@/lib/exceptions';
import { MCP_OAUTH_ISSUER } from '@/mcp/auth/oauth';
import { isLoopbackRedirect } from '@/mcp/auth/redirect-uri';
import { clientDisplayName, clientIdentityHost, urlHost } from '@/mcp/auth/client-identity';
import { findUserMemberships } from '@/repositories/postgres/dashboard.repository';
import {
  findMcpConsentGrant,
  findOauthClient,
  replaceMcpGrant,
} from '@/repositories/postgres/mcpGrant.repository';
import {
  isMcpConsentRequestAnswered,
  markMcpConsentRequestAnswered,
} from '@/repositories/postgres/mcpConsentRequest.repository';
import {
  assertPickedDashboardsAvailable,
  grantableDashboards,
  grantedDashboards,
} from '@/services/auth/mcpAccess.service';

// What the OAuth provider adds to the authorization request it signs for the consent page
const SIGNATURE_PARAMS = ['sig', 'exp', 'ba_iat', 'ba_param', 'ba_pl'];

export type McpConsentRequest = {
  clientName: string;
  // CIMD clients are vouched for by the host of their client_id URL; DCR clients name themselves
  verified: boolean;
  identityHost: string | null;
  logoUrl: string | null;
  redirectHost: string;
  redirectIsLoopback: boolean;
  // every registered redirect goes to this device, which is when the page warns about it
  onlyLoopbackRedirects: boolean;
  dashboards: { id: string; domain: string; role: DashboardRole; aiAccessEnabled: boolean }[];
  // the dashboards the current grant still covers, when the client was connected before
  previous: McpGrantSelection | null;
  // the request without its signature, which sends a signed-out visitor through sign-in and back here
  authorizeUrl: string;
};

/**
 * The signed authorization request from the consent page's query, as the provider put it there. Anything else in
 * the query (a locale switch, say) is dropped, as the provider's own client does.
 */
export function signedOAuthQuery(searchParams: Record<string, string | string[] | undefined>): string | null {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  const signedNames = new Set(params.getAll('ba_param'));
  if (!params.has('sig') || signedNames.size === 0) return null;

  const signed = new URLSearchParams();
  for (const [key, value] of params) {
    if (key === 'sig' || key === 'ba_param' || signedNames.has(key)) signed.append(key, value);
  }
  return signed.toString();
}

// The provider's signature stays valid until it expires, so a request answered once is remembered by it
function requestKey(params: URLSearchParams): string {
  return createHash('sha256')
    .update(params.get('sig') ?? '')
    .digest('base64url');
}

/** The request's parameters, or null when it is unsigned, expired or already answered with Allow or Cancel. */
async function verifiedRequest(oauthQuery: string): Promise<URLSearchParams | null> {
  if (!(await verifyOAuthQueryParams(oauthQuery, env.AUTH_SECRET))) return null;
  const params = new URLSearchParams(oauthQuery);
  if (!params.get('client_id') || !params.get('redirect_uri')) return null;
  return (await isMcpConsentRequestAnswered(requestKey(params))) ? null : params;
}

const AUTHORIZE_URL = `${MCP_OAUTH_ISSUER}/oauth2/authorize`;

function promptsOf(params: URLSearchParams): string[] {
  return (params.get('prompt') ?? '').split(' ').filter(Boolean);
}

/**
 * The request without its signature (and without the prompts left out), at the authorization endpoint, which signs
 * it afresh and sends the browser on: to sign-in when signed out or asked to sign in again, else to consent.
 */
function authorizeUrl(params: URLSearchParams, leaveOut: string[] = []): string {
  const unsigned = new URLSearchParams(params);
  for (const name of SIGNATURE_PARAMS) unsigned.delete(name);
  const prompt = promptsOf(params).filter((value) => !leaveOut.includes(value));
  if (prompt.length) unsigned.set('prompt', prompt.join(' '));
  else unsigned.delete('prompt');
  return `${AUTHORIZE_URL}?${unsigned}`;
}

/** The value when it is an authorization URL as {@link authorizeUrl} builds it, for a page that returns to consent. */
export function toMcpAuthorizeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}` === AUTHORIZE_URL && url.searchParams.has('client_id') && !url.hash
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export type McpSignInRequest =
  | {
      status: 'open';
      // the app being connected, unless the client is gone or disabled
      client: { name: string; verified: boolean } | null;
      authorizeUrl: string;
      // where a signed-in visitor goes on, or null when the request asks them to sign in again (prompt=login or
      // max_age), which signing in here does: the provider then drops both. Already having an account answers
      // prompt=create, which the provider would otherwise keep sending back here.
      signedInUrl: string | null;
    }
  // the signature expired (10 minutes) or doesn't match: the authorization starts over
  | { status: 'stale'; authorizeUrl: string };

/** The authorization request a sign-in or sign-up page carries, or null when the query isn't one. */
export async function getMcpSignInRequest(oauthQuery: string): Promise<McpSignInRequest | null> {
  const params = new URLSearchParams(oauthQuery);
  const clientId = params.get('client_id');
  const redirectHost = urlHost(params.get('redirect_uri') ?? '');
  if (!clientId || !redirectHost) return null;
  if (!(await verifyOAuthQueryParams(oauthQuery, env.AUTH_SECRET))) {
    return { status: 'stale', authorizeUrl: authorizeUrl(params) };
  }

  const open = {
    status: 'open' as const,
    authorizeUrl: authorizeUrl(params),
    signedInUrl:
      promptsOf(params).includes('login') || params.has('max_age') ? null : authorizeUrl(params, ['create']),
  };
  const client = await findOauthClient(clientId);
  if (!client || client.disabled) return { ...open, client: null };
  const name = clientDisplayName(client.name, clientIdentityHost(client), redirectHost) ?? redirectHost;
  return { ...open, client: { name, verified: client.discovered } };
}

async function requireOpenRequest(oauthQuery: string): Promise<URLSearchParams> {
  const params = await verifiedRequest(oauthQuery);
  if (!params) throw new UserException('This connection request is no longer valid', MCP_CONSENT_REQUEST_INVALID);
  return params;
}

async function markAnswered(params: URLSearchParams): Promise<void> {
  await markMcpConsentRequestAnswered(requestKey(params), new Date(Number(params.get('exp')) * 1000));
}

/** Null for a request that is unsigned, expired, already answered, or for a client that is gone or disabled. */
export async function getMcpConsentRequest(userId: string, oauthQuery: string): Promise<McpConsentRequest | null> {
  const params = await verifiedRequest(oauthQuery);
  if (!params) return null;
  const clientId = params.get('client_id')!;
  const redirectUri = params.get('redirect_uri')!;

  const [client, memberships, consent] = await Promise.all([
    findOauthClient(clientId),
    findUserMemberships(userId),
    findMcpConsentGrant(userId, clientId),
  ]);
  const redirectHost = urlHost(redirectUri);
  if (!client || client.disabled || !redirectHost) return null;

  const identityHost = clientIdentityHost(client);
  const logoUrl = client.discovered && client.icon?.startsWith('https://') ? client.icon : null;

  const previous = consent?.grant
    ? {
        allDashboards: consent.grant.allDashboards,
        dashboardIds: grantedDashboards(consent.grant, memberships).map((dashboard) => dashboard.dashboardId),
      }
    : null;

  return {
    clientName: clientDisplayName(client.name, identityHost, redirectHost) ?? redirectHost,
    verified: client.discovered,
    identityHost,
    logoUrl,
    redirectHost,
    redirectIsLoopback: isLoopbackRedirect(redirectUri),
    onlyLoopbackRedirects: client.redirectUris.length > 0 && client.redirectUris.every(isLoopbackRedirect),
    dashboards: grantableDashboards(memberships),
    previous,
    authorizeUrl: authorizeUrl(params),
  };
}

async function submitConsent(accept: boolean, oauthQuery: string, requestHeaders: Headers): Promise<string> {
  const response = await auth.api.oauth2Consent({
    headers: requestHeaders,
    // an accepted consent reruns the authorization, which wants the request it came in on
    request: new Request(`${MCP_OAUTH_ISSUER}/oauth2/consent`, { method: 'POST', headers: requestHeaders }),
    body: { accept, oauth_query: oauthQuery },
    asResponse: true,
  });
  const body = (await response.json().catch(() => null)) as { url?: unknown } | null;
  if (!response.ok || typeof body?.url !== 'string') {
    throw new Error(`The OAuth provider refused the consent (${response.status})`);
  }
  return body.url;
}

/**
 * Stores the consent through the OAuth provider, then its grant, and returns where the browser goes next: the
 * client's redirect with the authorization code. The code only leaves once the grant is stored.
 */
export async function allowMcpConsent(
  userId: string,
  oauthQuery: string,
  selection: McpGrantSelection,
  requestHeaders: Headers,
): Promise<string> {
  const params = await requireOpenRequest(oauthQuery);
  const clientId = params.get('client_id')!;

  const previous = await findMcpConsentGrant(userId, clientId);
  await assertPickedDashboardsAvailable(userId, selection, previous?.grant ?? null);

  const url = await submitConsent(true, oauthQuery, requestHeaders);

  const consent = await findMcpConsentGrant(userId, clientId);
  if (!consent) throw new Error('The OAuth provider stored no consent');
  await replaceMcpGrant(consent.consentId, selection);
  await markAnswered(params);

  return url;
}

/** The client's redirect with `error=access_denied` and its state. */
export async function denyMcpConsent(oauthQuery: string, requestHeaders: Headers): Promise<string> {
  const params = await requireOpenRequest(oauthQuery);
  const url = await submitConsent(false, oauthQuery, requestHeaders);
  await markAnswered(params);
  return url;
}
