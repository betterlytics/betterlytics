import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@better-auth/oauth-provider', () => ({ verifyOAuthQueryParams: vi.fn(async () => true) }));
vi.mock('@/lib/better-auth', () => ({ auth: { api: { oauth2Consent: vi.fn() } } }));
vi.mock('@/lib/env', () => ({ env: { AUTH_SECRET: 'secret' } }));
vi.mock('@/mcp/auth/oauth', () => ({ MCP_OAUTH_ISSUER: 'https://betterlytics.example/api/auth' }));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({ findUserMemberships: vi.fn(async () => []) }));
vi.mock('@/repositories/postgres/mcpGrant.repository', () => ({
  findOauthClient: vi.fn(),
  findMcpConsentGrant: vi.fn(),
  replaceMcpGrant: vi.fn(),
}));
vi.mock('@/repositories/postgres/mcpConsentRequest.repository', () => ({
  isMcpConsentRequestAnswered: vi.fn(async () => false),
  markMcpConsentRequestAnswered: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({}));

import { verifyOAuthQueryParams } from '@better-auth/oauth-provider';
import { auth } from '@/lib/better-auth';
import { findMcpConsentGrant, findOauthClient } from '@/repositories/postgres/mcpGrant.repository';
import {
  isMcpConsentRequestAnswered,
  markMcpConsentRequestAnswered,
} from '@/repositories/postgres/mcpConsentRequest.repository';
import {
  allowMcpConsent,
  denyMcpConsent,
  getMcpConsentRequest,
  getMcpSignInRequest,
  signedOAuthQuery,
  toMcpAuthorizeUrl,
} from '@/services/auth/mcpConsent.service';

const EXP = 1_900_000_000;
const QUERY = `client_id=c&redirect_uri=${encodeURIComponent('http://127.0.0.1:4000/callback')}&exp=${EXP}&sig=abc`;
const ALL = { allDashboards: true, dashboardIds: [] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyOAuthQueryParams).mockResolvedValue(true);
  vi.mocked(isMcpConsentRequestAnswered).mockResolvedValue(false);
  vi.mocked(findOauthClient).mockResolvedValue({
    clientId: 'c',
    name: 'Agent',
    icon: null,
    redirectUris: ['http://127.0.0.1:4000/callback'],
    discovered: false,
    disabled: false,
  });
  vi.mocked(findMcpConsentGrant).mockResolvedValue({ consentId: 'consent-1', createdAt: null, grant: null });
  vi.mocked(auth.api.oauth2Consent).mockImplementation(
    async () => Response.json({ url: 'http://127.0.0.1:4000/callback?code=x' }) as never,
  );
});

describe('signedOAuthQuery', () => {
  it('keeps the signed parameters and drops anything added to the page URL', () => {
    expect(
      signedOAuthQuery({
        client_id: 'c',
        scope: 'dashboards:read',
        ba_param: ['ba_param', 'client_id', 'scope'],
        sig: 'abc',
        utm_source: 'mail',
      }),
    ).toBe('client_id=c&scope=dashboards%3Aread&ba_param=ba_param&ba_param=client_id&ba_param=scope&sig=abc');
  });

  it('is null without a signature or the list of signed parameters', () => {
    expect(signedOAuthQuery({ client_id: 'c', ba_param: 'client_id' })).toBeNull();
    expect(signedOAuthQuery({ client_id: 'c', sig: 'abc' })).toBeNull();
  });
});

describe('answered consent requests', () => {
  it('records a request once it is allowed or cancelled, until its signature expires', async () => {
    await allowMcpConsent('user-1', QUERY, ALL, new Headers());
    await denyMcpConsent(QUERY, new Headers());

    const [[allowedKey, expiresAt], [cancelledKey]] = vi.mocked(markMcpConsentRequestAnswered).mock.calls;
    expect(expiresAt).toEqual(new Date(EXP * 1000));
    expect(cancelledKey).toBe(allowedKey);
  });

  it('shows the invalid-request state for an answered request and refuses to answer it again', async () => {
    vi.mocked(isMcpConsentRequestAnswered).mockResolvedValue(true);

    expect(await getMcpConsentRequest('user-1', QUERY)).toBeNull();
    await expect(allowMcpConsent('user-1', QUERY, ALL, new Headers())).rejects.toMatchObject({
      code: 'MCP_CONSENT_REQUEST_INVALID',
    });
    await expect(denyMcpConsent(QUERY, new Headers())).rejects.toMatchObject({
      code: 'MCP_CONSENT_REQUEST_INVALID',
    });
    expect(auth.api.oauth2Consent).not.toHaveBeenCalled();
  });

  it('leaves a request open when the provider refuses it, so Allow can be tried again', async () => {
    vi.mocked(auth.api.oauth2Consent).mockImplementation(async () => new Response(null, { status: 500 }) as never);

    await expect(allowMcpConsent('user-1', QUERY, ALL, new Headers())).rejects.toThrow();
    expect(markMcpConsentRequestAnswered).not.toHaveBeenCalled();
  });
});

describe('getMcpSignInRequest', () => {
  const AUTHORIZE = 'https://betterlytics.example/api/auth/oauth2/authorize';

  const REDIRECT = encodeURIComponent('http://127.0.0.1:4000/callback');

  it('names the app being connected, and resumes at the authorization without the signature', async () => {
    expect(await getMcpSignInRequest(`${QUERY}&prompt=consent&ba_iat=1&ba_param=client_id`)).toEqual({
      status: 'open',
      client: { name: 'Agent', verified: false },
      authorizeUrl: `${AUTHORIZE}?client_id=c&redirect_uri=${REDIRECT}&prompt=consent`,
      signedInUrl: `${AUTHORIZE}?client_id=c&redirect_uri=${REDIRECT}&prompt=consent`,
    });
  });

  it('keeps a signed-in visitor here when the request asks them to sign in again', async () => {
    for (const asks of ['prompt=login+consent', 'max_age=60']) {
      expect(await getMcpSignInRequest(`${QUERY}&${asks}`)).toMatchObject({ status: 'open', signedInUrl: null });
    }
  });

  it('sends a signed-in visitor on without prompt=create, which their account answers', async () => {
    expect(await getMcpSignInRequest(`${QUERY}&prompt=create+consent`)).toMatchObject({
      authorizeUrl: `${AUTHORIZE}?client_id=c&redirect_uri=${REDIRECT}&prompt=create+consent`,
      signedInUrl: `${AUTHORIZE}?client_id=c&redirect_uri=${REDIRECT}&prompt=consent`,
    });
  });

  it('starts an expired request over, and names no app for one that is gone', async () => {
    vi.mocked(verifyOAuthQueryParams).mockResolvedValue(false);
    expect(await getMcpSignInRequest(QUERY)).toMatchObject({ status: 'stale' });

    vi.mocked(verifyOAuthQueryParams).mockResolvedValue(true);
    vi.mocked(findOauthClient).mockResolvedValue(null);
    expect(await getMcpSignInRequest(QUERY)).toMatchObject({ status: 'open', client: null });
  });

  it('is null for a query that is no authorization request', async () => {
    expect(await getMcpSignInRequest('sig=abc&client_id=c')).toBeNull();
  });
});

describe('toMcpAuthorizeUrl', () => {
  it('accepts only an authorization request at this issuer', () => {
    const url = 'https://betterlytics.example/api/auth/oauth2/authorize?client_id=c';
    expect(toMcpAuthorizeUrl(url)).toBe(url);
    for (const value of [
      undefined,
      ['/a'],
      '/api/auth/oauth2/authorize?client_id=c',
      'https://evil.example/api/auth/oauth2/authorize?client_id=c',
      'https://betterlytics.example/api/auth/oauth2/authorize',
      'https://betterlytics.example/api/auth/sign-out?client_id=c',
      'https://betterlytics.example@evil.example/api/auth/oauth2/authorize?client_id=c',
    ]) {
      expect(toMcpAuthorizeUrl(value)).toBeNull();
    }
  });
});
