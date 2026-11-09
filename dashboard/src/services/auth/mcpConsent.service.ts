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
import { grantedDashboards } from '@/services/auth/mcpAccess.service';

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
  dashboards: { id: string; domain: string; role: DashboardRole }[];
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

async function requireOpenRequest(oauthQuery: string): Promise<URLSearchParams> {
  const params = await verifiedRequest(oauthQuery);
  if (!params) throw new UserException('This connection request is no longer valid', MCP_CONSENT_REQUEST_INVALID);
  return params;
}

async function markAnswered(params: URLSearchParams): Promise<void> {
  await markMcpConsentRequestAnswered(requestKey(params), new Date(Number(params.get('exp')) * 1000));
}

function urlHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
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

  const identityHost = client.discovered ? urlHost(client.clientId) : null;
  const logoUrl = client.discovered && client.icon?.startsWith('https://') ? client.icon : null;

  const unsigned = new URLSearchParams(params);
  for (const name of SIGNATURE_PARAMS) unsigned.delete(name);

  const previous = consent?.grant
    ? {
        allDashboards: consent.grant.allDashboards,
        dashboardIds: grantedDashboards(consent.grant, memberships).map((dashboard) => dashboard.dashboardId),
      }
    : null;

  return {
    clientName: client.name?.trim() || identityHost || redirectHost,
    verified: client.discovered,
    identityHost,
    logoUrl,
    redirectHost,
    redirectIsLoopback: isLoopbackRedirect(redirectUri),
    onlyLoopbackRedirects: client.redirectUris.length > 0 && client.redirectUris.every(isLoopbackRedirect),
    dashboards: memberships
      .map(({ dashboardId, domain, role }) => ({ id: dashboardId, domain, role }))
      .sort((a, b) => a.domain.localeCompare(b.domain)),
    previous,
    authorizeUrl: `${MCP_OAUTH_ISSUER}/oauth2/authorize?${unsigned}`,
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

  // every picked dashboard is checked against the user's memberships now, not as the page showed them
  if (!selection.allDashboards) {
    const memberOf = new Set((await findUserMemberships(userId)).map((membership) => membership.dashboardId));
    if (selection.dashboardIds.some((dashboardId) => !memberOf.has(dashboardId))) {
      throw new UserException('One of the picked dashboards is no longer available');
    }
  }

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
