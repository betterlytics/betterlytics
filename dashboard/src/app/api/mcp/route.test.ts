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

const toolCall = (name: string, args: Record<string, unknown>, id = 1) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args },
});

function post(body: unknown, headers: Record<string, string> = {}) {
  mocks.executeQuery.mockClear();
  return POST(
    new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: {
        authorization: 'Bearer btl_test',
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...headers,
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

  it('charges a call with invalid arguments to the credential and leaves the named site its full quota', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('invalid') });

    const invalid = await callTool('query', { ...QUERY_ARGS, metrics: [], dashboardId: 'dash-a' });
    expect(invalid.status).toBe(200);
    expect((await invalid.json()).result.isError).toBe(true);

    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });
    expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' })).status).toBe(429);
  });

  it('answers an invalid call for a site over its limit, because it cannot read that site', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('invalid-full') });
    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });

    const invalid = await callTool('query', { ...QUERY_ARGS, metrics: [], dashboardId: 'dash-a' });
    expect(invalid.status).toBe(200);
    expect((await invalid.json()).result.isError).toBe(true);
  });

  it('limits invalid calls through the credential', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('invalid-limit') });
    const invalid = { ...QUERY_ARGS, metrics: [], dashboardId: 'dash-a' };
    await exhaust('query', invalid);

    expect((await callTool('query', invalid)).status).toBe(429);
    expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' })).status).toBe(200);
  });

  it('uses no quota on any site or the credential when a batch is rejected', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('batch') });
    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-b' });

    const rejected = await post([
      toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-a' }, 1),
      toolCall('list_dashboards', {}, 2),
      toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-b' }, 3),
    ]);
    expect(rejected.status).toBe(429);
    expect(Number(rejected.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(mocks.executeQuery).not.toHaveBeenCalled();

    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });
    expect((await callTool('query', { ...QUERY_ARGS, dashboardId: 'dash-a' })).status).toBe(429);
    await exhaust('list_dashboards');
    expect((await callTool('list_dashboards')).status).toBe(429);
  });

  it('rejects a batch with more reads of a site than it has slots, recording none of them', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('repeat') });
    const read = { ...QUERY_ARGS, dashboardId: 'dash-a' };
    for (let i = 0; i < LIMIT - 1; i++) {
      expect((await callTool('query', read)).status).toBe(200);
    }

    const rejected = await post([toolCall('query', read, 1), toolCall('query', read, 2)]);
    expect(rejected.status).toBe(429);
    expect(mocks.executeQuery).not.toHaveBeenCalled();

    expect((await callTool('query', read)).status).toBe(200);
    expect((await callTool('query', read)).status).toBe(429);
  });

  it.each([
    ['Accept', { accept: 'application/json' }, 406],
    ['Content-Type', { 'content-type': 'text/plain' }, 415],
    ['Mcp-Protocol-Version', { 'mcp-protocol-version': '1999-01-01' }, 400],
  ])('charges a call the transport rejects for its %s header to the credential', async (name, headers, status) => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards(`header-${name}`) });
    const read = toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });

    expect((await post(read, headers)).status).toBe(status);

    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });
    expect((await post(read)).status).toBe(429);
  });

  it.each([
    ['a malformed message', { jsonrpc: '1.0', id: 2, method: 'tools/list' }],
    [
      'an initialize',
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'c', version: '1' } },
      },
    ],
  ])('charges a batch the transport rejects for %s to the credential', async (label, other) => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards(`batch-${label}`) });
    const read = toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });

    expect((await post([read, other])).status).toBe(400);
    expect(mocks.executeQuery).not.toHaveBeenCalled();

    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });
    expect((await post(read)).status).toBe(429);
  });

  it.each([
    ['reads of one site', 'query', { ...QUERY_ARGS, dashboardId: 'dash-a' }],
    ['calls charged to the credential', 'list_dashboards', {}],
  ])('answers a batch with more %s than one window allows with a 413 and uses no quota', async (label, name, args) => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards(`oversized-${label}`) });

    const rejected = await post(Array.from({ length: LIMIT + 1 }, (_, i) => toolCall(name, args, i + 1)));
    expect(rejected.status).toBe(413);
    expect(rejected.headers.get('Retry-After')).toBeNull();
    expect((await rejected.json()).error.message).toContain('smaller batches');
    expect(mocks.executeQuery).not.toHaveBeenCalled();

    await exhaust(name, args);
    expect((await callTool(name, args)).status).toBe(429);
  });

  it('still accepts a batch that fills a window exactly', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('full-batch') });
    const read = (id: number) => toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-a' }, id);

    expect((await post(Array.from({ length: LIMIT }, (_, i) => read(i + 1)))).status).toBe(200);
    expect((await post(read(1))).status).toBe(429);
  });

  it('charges a task-augmented call, which the server refuses, to the credential', async () => {
    mocks.validateToken.mockResolvedValue({ valid: true, context: severalDashboards('task') });
    const read = toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });

    const refused = await post({ ...read, params: { ...read.params, task: { ttl: 1000 } } });
    expect((await refused.json()).error.code).toBe(-32603);
    expect(mocks.executeQuery).not.toHaveBeenCalled();

    await exhaust('query', { ...QUERY_ARGS, dashboardId: 'dash-a' });
    expect((await post(read)).status).toBe(429);
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
