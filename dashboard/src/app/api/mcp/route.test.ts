import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { McpContext } from '@/mcp/context';

const RESOURCE_METADATA = vi.hoisted(
  () => 'https://betterlytics.example/.well-known/oauth-protected-resource/api/mcp',
);

const mocks = vi.hoisted(() => ({
  validateToken: vi.fn(),
  validateOAuthToken: vi.fn(),
  oauthEnabled: false,
  executeQuery: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@/mcp/auth/token', () => ({ validateToken: mocks.validateToken }));
vi.mock('@/mcp/auth/oauth-token', () => ({ validateOAuthToken: mocks.validateOAuthToken }));
vi.mock('@/mcp/auth/oauth', () => ({
  isMcpOAuthEnabled: () => mocks.oauthEnabled,
  MCP_RESOURCE_METADATA_URL: RESOURCE_METADATA,
}));
vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: () => false }));
// The tool modules are kept for their input schemas; the services behind them are never reached.
vi.mock('@/lib/env', () => ({ env: {} }));
vi.mock('@/services/analytics/userJourney.service', () => ({}));
vi.mock('@/services/analytics/funnels.service', () => ({}));
vi.mock('@/services/analytics/errors.service', () => ({}));
vi.mock('@/services/analytics/monitoring.service', () => ({}));
vi.mock('@/services/analytics/statusPage.service', () => ({}));
vi.mock('@/services/analytics/publicStatusPage.service', () => ({}));
vi.mock('@/services/analytics/statusPageIncident.service', () => ({}));
vi.mock('@/repositories/clickhouse/globalProperties.repository', () => ({}));
vi.mock('@/mcp/tools/query', () => ({ executeQuery: mocks.executeQuery }));
vi.mock('@/mcp/tools/querySessions', () => ({ executeQuerySessions: vi.fn() }));

import { POST } from '@/app/api/mcp/route';

const LIMIT = 60;
const QUERY_ARGS = { timeRange: '7d', timezone: 'UTC', metrics: ['visitors'] };

// The limiter is per process, so each test gets its own credential and sites.
function severalDashboards(name: string): McpContext {
  return {
    credentialId: `credential-${name}`,
    dashboards: [
      { dashboardId: 'dash-a', siteId: `site-a-${name}`, domain: 'a.example.com', role: 'owner' },
      { dashboardId: 'dash-b', siteId: `site-b-${name}`, domain: 'b.example.com', role: 'viewer' },
    ],
  };
}

const toolCall = (name: string, args: Record<string, unknown>, id = 1) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args },
});

function post(body: unknown, authorization: string | null = 'Bearer btl_test') {
  mocks.executeQuery.mockClear();
  return POST(
    new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: {
        ...(authorization ? { authorization } : {}),
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify(body),
    }),
  );
}

function callTool(name: string, args: Record<string, unknown> = {}) {
  return post(toolCall(name, args));
}

async function exhaust(name: string, args: Record<string, unknown> = {}) {
  for (let i = 0; i < LIMIT; i++) {
    expect((await callTool(name, args)).status).toBe(200);
  }
}

describe('POST /api/mcp', () => {
  it('reads the named dashboard after the rate limit has read the body', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('read') });

    const response = await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-b' });

    expect(response.status).toBe(200);
    expect(mocks.executeQuery).toHaveBeenCalledWith(expect.anything(), 'site-b-read');
  });

  it('answers 429 with Retry-After for a site over its limit and leaves the other site alone', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('site') });
    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });

    const limited = await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(mocks.executeQuery).not.toHaveBeenCalled();

    const other = await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-b' });
    expect(other.status).toBe(200);
  });

  it.each([
    ['a tool that does not exist', 'no_such_tool'],
    ['describe', 'describe'],
    ['list_dashboards', 'list_dashboards'],
  ])('charges %s to the credential even when it is given a dashboardId', async (_label, name) => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards(`credential-${name}`) });
    await exhaust('list_dashboards');

    expect((await callTool(name, { dashboardId: 'dash-a' })).status).toBe(429);
    expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' })).status).toBe(200);
  });

  it('does not use up a site when a call that reads no dashboard names it', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('unused') });
    await callTool('no_such_tool', { dashboardId: 'dash-a' });

    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });
    expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' })).status).toBe(429);
  });

  it('counts a call with invalid arguments against the site it names', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('invalid') });
    await exhaust('query', { ...QUERY_ARGS, metrics: [], dashboardId: 'dash-a' });

    expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' })).status).toBe(429);
    expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-b' })).status).toBe(200);
  });

  it('counts each message of a batch against the site it reads', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('batch') });
    const read = (dashboardId: string, id: number) => toolCall('query', { ...QUERY_ARGS, dashboardId }, id);

    expect((await post([read('dash-a', 1), read('dash-a', 2), read('dash-b', 3)])).status).toBe(200);

    for (let i = 0; i < LIMIT - 2; i++) {
      expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' })).status).toBe(200);
    }
    expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' })).status).toBe(429);
  });

  it('answers a batch with a message over its limit with 429 and runs none of it', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('batch-limited') });
    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-b' });

    const rejected = await post([
      toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-a' }, 1),
      toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-b' }, 2),
    ]);
    expect(rejected.status).toBe(429);
    expect(Number(rejected.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(mocks.executeQuery).not.toHaveBeenCalled();
  });

  it('counts an invalid call of a single-dashboard credential against its site, as before', async () => {
    const { dashboards } = severalDashboards('single-invalid');
    mocks.validateToken.mockResolvedValue({
      valid: true,
      context: { credentialId: 'credential-single-invalid', dashboards: [dashboards[0]!] },
    });
    await exhaust('query', { ...QUERY_ARGS, metrics: [] });

    expect((await callTool('query', QUERY_ARGS)).status).toBe(429);
  });

  it('counts every request of a single-dashboard credential against its site', async () => {
    const { dashboards } = severalDashboards('single');
    mocks.validateToken.mockResolvedValue({
      valid: true,
      context: { credentialId: 'credential-single', dashboards: [dashboards[0]!] },
    });
    await exhaust('describe');

    expect((await callTool('no_such_tool')).status).toBe(429);
    expect((await callTool('query', QUERY_ARGS)).status).toBe(429);
  });
});

describe('POST /api/mcp authentication', () => {
  const LIST = { jsonrpc: '2.0', id: 1, method: 'tools/list' };
  const context = severalDashboards('auth');

  beforeEach(() => {
    mocks.validateToken.mockReset();
    mocks.validateOAuthToken.mockReset();
  });
  afterEach(() => {
    mocks.oauthEnabled = false;
  });

  describe('on cloud', () => {
    beforeEach(() => {
      mocks.oauthEnabled = true;
    });

    it('points a call without a token to the protected resource metadata', async () => {
      const response = await post(LIST, null);

      expect(response.status).toBe(401);
      expect(response.headers.get('WWW-Authenticate')).toBe(
        `Bearer realm="betterlytics-mcp", resource_metadata="${RESOURCE_METADATA}"`,
      );
    });

    it('checks any other bearer as an OAuth access token', async () => {
      mocks.validateOAuthToken.mockResolvedValue({ valid: true, context });

      const response = await post(LIST, 'Bearer eyJ.oauth.token');

      expect(response.status).toBe(200);
      expect(mocks.validateOAuthToken).toHaveBeenCalledWith('eyJ.oauth.token');
      expect(mocks.validateToken).not.toHaveBeenCalled();
    });

    it('keeps checking personal tokens as before', async () => {
      mocks.validateToken.mockResolvedValue({ valid: true, context });

      expect((await post(LIST, 'Bearer btl_personal')).status).toBe(200);
      expect(mocks.validateToken).toHaveBeenCalledWith('btl_personal');
      expect(mocks.validateOAuthToken).not.toHaveBeenCalled();
    });

    it('answers a revoked OAuth token with an invalid_token challenge', async () => {
      mocks.validateOAuthToken.mockResolvedValue({ valid: false, reason: 'Access has been revoked' });

      const response = await post(LIST, 'Bearer eyJ.revoked');

      expect(response.status).toBe(401);
      expect(response.headers.get('WWW-Authenticate')).toBe(
        `Bearer realm="betterlytics-mcp", resource_metadata="${RESOURCE_METADATA}", error="invalid_token", error_description="Access has been revoked"`,
      );
    });
  });

  describe('on self-host', () => {
    it('keeps the plain challenge for a call without a token', async () => {
      const response = await post(LIST, null);

      expect(response.status).toBe(401);
      expect(response.headers.get('WWW-Authenticate')).toBe('Bearer realm="betterlytics-mcp"');
    });

    it('treats any token as a personal token', async () => {
      mocks.validateToken.mockResolvedValue({ valid: false, reason: 'Invalid MCP token' });

      const response = await post(LIST, 'Bearer eyJ.oauth.token');

      expect(response.status).toBe(401);
      expect(mocks.validateToken).toHaveBeenCalledWith('eyJ.oauth.token');
      expect(mocks.validateOAuthToken).not.toHaveBeenCalled();
      expect(response.headers.get('WWW-Authenticate')).toBe(
        'Bearer realm="betterlytics-mcp", error="invalid_token", error_description="Invalid MCP token"',
      );
    });
  });
});
