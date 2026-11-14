import { describe, it, expect, vi } from 'vitest';

vi.mock('@/mcp/auth/oauth', () => ({ MCP_RESOURCE: 'https://betterlytics.example/api/mcp' }));

import { withMcpAuthorizationDefaults } from '@/mcp/auth/authorize-request';

describe('withMcpAuthorizationDefaults', () => {
  it('asks for consent, a refresh token and the MCP resource', () => {
    expect(withMcpAuthorizationDefaults({ client_id: 'c', scope: 'dashboards:read' })).toEqual({
      client_id: 'c',
      scope: 'dashboards:read offline_access',
      prompt: 'consent',
      resource: 'https://betterlytics.example/api/mcp',
    });
  });

  it('keeps what the client already asked for', () => {
    expect(
      withMcpAuthorizationDefaults({
        scope: 'offline_access dashboards:read',
        prompt: 'login consent',
        resource: 'https://other.example/api/mcp',
      }),
    ).toEqual({
      scope: 'offline_access dashboards:read',
      prompt: 'login consent',
      resource: 'https://other.example/api/mcp',
    });
  });

  it('adds consent to other prompts, but leaves prompt=none and a missing scope alone', () => {
    expect(withMcpAuthorizationDefaults({ prompt: 'login' }).prompt).toBe('login consent');
    expect(withMcpAuthorizationDefaults({ prompt: 'none' }).prompt).toBe('none');
    expect(withMcpAuthorizationDefaults({}).scope).toBeUndefined();
  });
});
