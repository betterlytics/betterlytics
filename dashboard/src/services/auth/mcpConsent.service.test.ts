import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/better-auth', () => ({ auth: {} }));
vi.mock('@/lib/env', () => ({ env: { AUTH_SECRET: 'secret' } }));
vi.mock('@/mcp/auth/oauth', () => ({ MCP_OAUTH_ISSUER: 'https://betterlytics.example/api/auth' }));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({}));
vi.mock('@/repositories/postgres/mcpGrant.repository', () => ({}));
vi.mock('@/repositories/postgres/user.repository', () => ({}));

import { signedOAuthQuery } from '@/services/auth/mcpConsent.service';

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
