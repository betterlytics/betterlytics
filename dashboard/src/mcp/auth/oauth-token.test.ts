import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyJwsAccessToken: vi.fn(),
  resolveOAuthMcpContext: vi.fn(),
}));

vi.mock('better-auth/oauth2', () => ({ verifyJwsAccessToken: mocks.verifyJwsAccessToken }));
vi.mock('@/lib/better-auth', () => ({ auth: { api: { getJwks: vi.fn() } } }));
vi.mock('@/mcp/auth/oauth', () => ({
  MCP_OAUTH_ISSUER: 'https://betterlytics.example/api/auth',
  MCP_READ_SCOPE: 'dashboards:read',
  MCP_RESOURCE: 'https://betterlytics.example/api/mcp',
}));
vi.mock('@/services/auth/mcpAccess.service', () => ({ resolveOAuthMcpContext: mocks.resolveOAuthMcpContext }));

import { validateOAuthToken } from '@/mcp/auth/oauth-token';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyJwsAccessToken.mockResolvedValue({
    sub: 'user-1',
    azp: 'client-1',
    scope: 'dashboards:read',
    iat: 1_795_000_000,
  });
});

describe('validateOAuthToken', () => {
  it('accepts a valid token while its connection exists', async () => {
    const context = { credentialId: 'oauth-consent:consent-1', dashboards: [] };
    mocks.resolveOAuthMcpContext.mockResolvedValue(context);

    expect(await validateOAuthToken('token')).toEqual({ valid: true, context });
    expect(mocks.resolveOAuthMcpContext).toHaveBeenCalledWith('user-1', 'client-1', 1_795_000_000);
  });

  it('refuses a token without an issue time, which a revoke could not be checked against', async () => {
    mocks.verifyJwsAccessToken.mockResolvedValue({ sub: 'user-1', azp: 'client-1', scope: 'dashboards:read' });

    expect(await validateOAuthToken('token')).toEqual({ valid: false, reason: 'Invalid access token' });
    expect(mocks.resolveOAuthMcpContext).not.toHaveBeenCalled();
  });

  it('refuses a token that has not expired once its connection is revoked', async () => {
    mocks.resolveOAuthMcpContext.mockResolvedValue(null);

    expect(await validateOAuthToken('token')).toEqual({ valid: false, reason: 'Access has been revoked' });
  });
});
