import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createHash, randomBytes, randomUUID, webcrypto } from 'node:crypto';

// The real auth config and handler on an in-memory database: every DPoP input a client can send, end to end
const BASE = 'http://localhost:3000';
const REDIRECT_URI = 'http://127.0.0.1:33418/callback';
const CIMD_CLIENT_ID = 'https://client.example/oauth/metadata.json';

vi.mock('@/lib/env', () => ({
  env: {
    AUTH_URL: 'http://localhost:3000',
    AUTH_SECRET: 'test-auth-secret-that-is-long-enough-for-better-auth',
    AUTH_TRUSTED_PROXIES: [],
    PUBLIC_BASE_URL: 'http://localhost:3000',
    IS_CLOUD: true,
  },
}));
vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: () => true }));
vi.mock('@/lib/postgres', () => ({ default: {} }));
vi.mock('@/lib/better-auth-prisma', () => ({ authPrisma: {} }));
vi.mock('better-auth/adapters/prisma', async () => {
  const { memoryAdapter } = await import('better-auth/adapters/memory');
  const { getAuthTables } = await import('better-auth/db');
  const db: Record<string, Record<string, unknown>[]> = {};
  return {
    prismaAdapter:
      () =>
      (options: Parameters<typeof getAuthTables>[0]): ReturnType<ReturnType<typeof memoryAdapter>> => {
        for (const table of Object.values(getAuthTables(options))) db[table.modelName] ??= [];
        return memoryAdapter(db)(options);
      },
  };
});
vi.mock('better-auth/next-js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('better-auth/next-js')>()),
  nextCookies: () => ({ id: 'next-cookies' }),
}));
vi.mock('@better-auth/cimd/node', () => ({
  fetchClientMetadataResource: async () =>
    Response.json({
      client_id: CIMD_CLIENT_ID,
      client_name: 'CIMD agent',
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      dpop_bound_access_tokens: true,
    }),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserById: vi.fn(async () => null),
  findUserByEmail: vi.fn(async () => null),
  findCredentialAccount: vi.fn(async () => null),
  touchUserLastActive: vi.fn(),
}));
vi.mock('@/repositories/postgres/resetToken.repository', () => ({
  RESET_TOKEN_PREFIX: 'reset-password:',
  findResetTokenUserId: vi.fn(),
  deleteUserResetTokens: vi.fn(),
}));
vi.mock('@/services/auth/signupGate.service', () => ({ getSignupAllowance: async () => 'registration_enabled' }));
vi.mock('@/services/account/userSettings.service', () => ({
  createDefaultUserSettings: vi.fn(),
  getUserSettings: vi.fn(),
}));
vi.mock('@/services/billing/subscription.service', () => ({ createStarterSubscriptionForUser: vi.fn() }));
vi.mock('@/services/account/verification.service', () => ({
  sendVerificationEmail: vi.fn(),
  VERIFICATION_LINK_EXPIRY_SECONDS: 86400,
}));
vi.mock('@/services/auth/twoFactorNotification.service', () => ({ sendTwoFactorChangedNotification: vi.fn() }));
vi.mock('@/constants/cookies', () => ({ setLocaleCookie: vi.fn() }));

import { GET as authGet, POST as authPost } from '@/app/api/auth/[...all]/route';
import { GET as getProtectedResourceMetadata } from '@/app/.well-known/oauth-protected-resource/[[...path]]/route';
import { GET as getAuthorizationServerMetadata } from '@/app/.well-known/oauth-authorization-server/[[...path]]/route';

const b64url = (data: Buffer | ArrayBuffer | string) => Buffer.from(data as Buffer).toString('base64url');

/** A valid ES256 DPoP proof for a token request, so only the filtering keeps it from binding the token. */
async function dpopProof(): Promise<string> {
  const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign'],
  );
  const { kty, crv, x, y } = await webcrypto.subtle.exportKey('jwk', publicKey);
  const header = b64url(JSON.stringify({ typ: 'dpop+jwt', alg: 'ES256', jwk: { kty, crv, x, y } }));
  const payload = b64url(
    JSON.stringify({
      htm: 'POST',
      htu: `${BASE}/api/auth/oauth2/token`,
      iat: Math.floor(Date.now() / 1000),
      jti: randomUUID(),
    }),
  );
  const signature = await webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    Buffer.from(`${header}.${payload}`),
  );
  return `${header}.${payload}.${b64url(signature)}`;
}

function authRequest(path: string, init: RequestInit = {}) {
  const request = new Request(`${BASE}/api/auth${path}`, init);
  return request.method === 'POST' ? authPost(request) : authGet(request);
}

let cookie = '';

beforeAll(async () => {
  const signUp = await authRequest('/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'agent-owner@example.com',
      password: 'Correct-horse-1',
      name: 'Owner',
      acceptedTerms: true,
    }),
  });
  expect(signUp.status).toBe(200);
  cookie = signUp.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
});

async function registerClient(): Promise<string> {
  const response = await authRequest('/oauth2/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_name: 'DCR agent',
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      dpop_bound_access_tokens: true,
    }),
  });
  const client = await response.json();
  expect(response.status).toBe(201);
  expect(client.dpop_bound_access_tokens).not.toBe(true);
  return client.client_id;
}

/** Authorize, accept consent and redeem the code, sending a DPoP proof with the token request. */
async function connect(clientId: string, authorizeParams: Record<string, string> = {}) {
  const verifier = b64url(randomBytes(32));
  const authorize = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: 'dashboards:read',
    state: 'state-1',
    code_challenge: b64url(createHash('sha256').update(verifier).digest()),
    code_challenge_method: 'S256',
    ...authorizeParams,
  });
  const toConsent = await authRequest(`/oauth2/authorize?${authorize}`, { headers: { cookie } });
  const consentPage = new URL(toConsent.headers.get('location') ?? '', BASE);
  expect(consentPage.pathname).toBe('/consent');
  expect(consentPage.searchParams.has('dpop_jkt')).toBe(false);

  const consent = await authRequest('/oauth2/consent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ accept: true, oauth_query: consentPage.search.slice(1) }),
  });
  const { url } = await consent.json();
  const code = new URL(url).searchParams.get('code');
  expect(code).toBeTruthy();

  const tokenRequest = async (body: Record<string, string>) => {
    const response = await authRequest('/oauth2/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', DPoP: await dpopProof() },
      body: new URLSearchParams({ client_id: clientId, ...body }),
    });
    const token = await response.json();
    expect(response.status, JSON.stringify(token)).toBe(200);
    return token;
  };
  const issued = await tokenRequest({
    grant_type: 'authorization_code',
    code: code!,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });
  const refreshed = await tokenRequest({ grant_type: 'refresh_token', refresh_token: issued.refresh_token });
  return [issued, refreshed];
}

function expectBearer(token: { token_type: string; access_token: string }) {
  expect(token.token_type).toBe('Bearer');
  const claims = JSON.parse(Buffer.from(token.access_token.split('.')[1], 'base64url').toString());
  expect(claims.cnf).toBeUndefined();
}

describe('DPoP is off', () => {
  it('leaves DPoP out of every discovery document', async () => {
    const documents = [
      await getProtectedResourceMetadata(new Request(`${BASE}/.well-known/oauth-protected-resource`), {
        params: Promise.resolve({}),
      }),
      await getProtectedResourceMetadata(new Request(`${BASE}/.well-known/oauth-protected-resource/api/mcp`), {
        params: Promise.resolve({ path: ['api', 'mcp'] }),
      }),
      await getAuthorizationServerMetadata(new Request(`${BASE}/.well-known/oauth-authorization-server`), {
        params: Promise.resolve({}),
      }),
      await getAuthorizationServerMetadata(
        new Request(`${BASE}/.well-known/oauth-authorization-server/api/auth`),
        {
          params: Promise.resolve({ path: ['api', 'auth'] }),
        },
      ),
      await authRequest('/.well-known/oauth-authorization-server'),
    ];
    for (const document of documents) {
      expect(document.status).toBe(200);
      expect(await document.text()).not.toMatch(/dpop/i);
    }
  });

  it('issues Bearer tokens to a DCR client that asked for DPoP-bound tokens', async () => {
    (await connect(await registerClient())).forEach(expectBearer);
  });

  it('issues Bearer tokens when authorize carries dpop_jkt', async () => {
    const dpopJkt = b64url(createHash('sha256').update('client key').digest());
    (await connect(await registerClient(), { dpop_jkt: dpopJkt })).forEach(expectBearer);
  });

  it('issues Bearer tokens to a CIMD client whose document asks for DPoP-bound tokens', async () => {
    (await connect(CIMD_CLIENT_ID)).forEach(expectBearer);
  });
});
