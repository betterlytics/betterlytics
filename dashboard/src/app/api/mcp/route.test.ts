import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { McpContext } from '@/mcp/context';

const mocks = vi.hoisted(() => ({
  validateToken: vi.fn(),
  executeQuery: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@/mcp/auth/token', () => ({ validateToken: mocks.validateToken }));
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

function callTool(name: string, args: Record<string, unknown> = {}) {
  mocks.executeQuery.mockClear();
  return POST(
    new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: {
        authorization: 'Bearer btl_test',
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
    }),
  );
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
