import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';
import type { McpContext, McpDashboard } from '@/mcp/context';

const execute = vi.hoisted(() => ({
  executeQuery: vi.fn(),
  executeQuerySessions: vi.fn(),
  executeUserJourneys: vi.fn(),
  executeFunnelPreview: vi.fn(),
  executeListFunnels: vi.fn(),
  executeListGlobalProperties: vi.fn(),
  executeListErrors: vi.fn(),
  executeGetError: vi.fn(),
  executeListMonitors: vi.fn(),
  executeListMonitorIncidents: vi.fn(),
  executeListStatusPages: vi.fn(),
  executeListIncidentSuggestions: vi.fn(),
}));

vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled: () => true }));
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
vi.mock('@/mcp/tools/query', () => ({ executeQuery: execute.executeQuery }));
vi.mock('@/mcp/tools/querySessions', () => ({ executeQuerySessions: execute.executeQuerySessions }));
vi.mock('@/mcp/tools/userJourneys', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeUserJourneys: execute.executeUserJourneys,
}));
vi.mock('@/mcp/tools/funnelPreview', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeFunnelPreview: execute.executeFunnelPreview,
}));
vi.mock('@/mcp/tools/listFunnels', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeListFunnels: execute.executeListFunnels,
}));
vi.mock('@/mcp/tools/globalProperties', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeListGlobalProperties: execute.executeListGlobalProperties,
}));
vi.mock('@/mcp/tools/errors', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeListErrors: execute.executeListErrors,
  executeGetError: execute.executeGetError,
}));
vi.mock('@/mcp/tools/monitoring', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeListMonitors: execute.executeListMonitors,
  executeListMonitorIncidents: execute.executeListMonitorIncidents,
}));
vi.mock('@/mcp/tools/statusPages', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeListStatusPages: execute.executeListStatusPages,
  executeListIncidentSuggestions: execute.executeListIncidentSuggestions,
}));

import { createMcpServer, dashboardToolNames } from '@/mcp/server';
import { rateLimitKeys } from '@/mcp/rate-limit';

const SHOP: McpDashboard = {
  dashboardId: 'dash-shop',
  siteId: 'site-shop',
  domain: 'shop.example.com',
  role: 'owner',
};
const BLOG = {
  dashboardId: 'dash-blog',
  siteId: 'site-blog',
  domain: 'blog.example.com',
  role: 'viewer' as const,
};

const RANGE = { timeRange: '7d', timezone: 'UTC' };
const STEP = { name: 'step', filters: [{ column: 'url', operator: '=', values: ['/'] }] };

// Each dashboard-scoped tool, valid arguments for it, the execute function behind it, and which of
// siteId / dashboardId that function receives after the tool's own input.
const DASHBOARD_TOOLS = [
  { name: 'query', args: { ...RANGE, metrics: ['visitors'] }, fn: execute.executeQuery, ids: ['siteId'] },
  {
    name: 'query_sessions',
    args: { ...RANGE, metrics: ['sessions'] },
    fn: execute.executeQuerySessions,
    ids: ['siteId'],
  },
  { name: 'user_journeys', args: RANGE, fn: execute.executeUserJourneys, ids: ['siteId'] },
  {
    name: 'funnel_preview',
    args: { ...RANGE, steps: [STEP, STEP] },
    fn: execute.executeFunnelPreview,
    ids: ['siteId'],
  },
  { name: 'list_global_properties', args: RANGE, fn: execute.executeListGlobalProperties, ids: ['siteId'] },
  { name: 'list_funnels', args: RANGE, fn: execute.executeListFunnels, ids: ['siteId', 'dashboardId'] },
  { name: 'list_errors', args: RANGE, fn: execute.executeListErrors, ids: ['siteId', 'dashboardId'] },
  { name: 'get_error', args: { fingerprint: 'fp-1' }, fn: execute.executeGetError, ids: ['siteId'] },
  { name: 'list_monitors', args: RANGE, fn: execute.executeListMonitors, ids: ['siteId', 'dashboardId'] },
  {
    name: 'list_monitor_incidents',
    args: RANGE,
    fn: execute.executeListMonitorIncidents,
    ids: ['siteId', 'dashboardId'],
  },
  { name: 'list_status_pages', args: {}, fn: execute.executeListStatusPages, ids: ['dashboardId'] },
  {
    name: 'list_incident_suggestions',
    args: {},
    fn: execute.executeListIncidentSuggestions,
    ids: ['dashboardId'],
  },
] as const;

async function connect(context: McpContext) {
  const server = createMcpServer(context);
  const client = new Client({ name: 'test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

function text(result: Awaited<ReturnType<Client['callTool']>>) {
  return (result.content as { type: string; text: string }[])[0]!.text;
}

function toolCallRequest(name: string, args: Record<string, unknown>) {
  return new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(execute)) fn.mockResolvedValue({ ok: true });
});

describe('createMcpServer', () => {
  const several: McpContext = { credentialId: 'mcp-token:2', dashboards: [SHOP, BLOG] };
  const single: McpContext = { credentialId: 'mcp-token:1', dashboards: [SHOP] };

  it('registers every dashboard-scoped tool with an optional dashboardId that points to list_dashboards', async () => {
    const client = await connect(single);
    const { tools } = await client.listTools();

    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(['describe', 'list_dashboards', ...DASHBOARD_TOOLS.map((t) => t.name)]),
    );
    expect(tools).toHaveLength(DASHBOARD_TOOLS.length + 2);
    expect(tools.find((t) => t.name === 'list_dashboards')!.description).toContain('dashboardId');

    for (const tool of tools) {
      const dashboardId = tool.inputSchema.properties?.dashboardId as { description?: string } | undefined;
      if (tool.name === 'describe' || tool.name === 'list_dashboards') {
        expect(dashboardId, tool.name).toBeUndefined();
        continue;
      }
      expect(dashboardId?.description, tool.name).toContain('list_dashboards');
      expect(tool.inputSchema.required ?? [], tool.name).not.toContain('dashboardId');
    }
  });

  it('reports exactly the tools that take a dashboardId as dashboard-scoped', async () => {
    const client = await connect(single);
    const { tools } = await client.listTools();

    const scoped = tools.filter((t) => Object.hasOwn(t.inputSchema.properties ?? {}, 'dashboardId'));
    expect([...dashboardToolNames()].sort()).toEqual(scoped.map((t) => t.name).sort());
  });

  // Clients use these to decide whether to ask before running a tool, so future write tools have to declare them too.
  it('gives every tool a title and declares every behaviour hint explicitly', async () => {
    const client = await connect(single);
    const { tools } = await client.listTools();

    // Includes list_dashboards and the tools only registered when monitoring or status pages are enabled.
    expect(tools.map((t) => t.name).sort()).toEqual(
      ['describe', 'list_dashboards', ...DASHBOARD_TOOLS.map((t) => t.name)].sort(),
    );
    for (const tool of tools) {
      expect(tool.title?.trim(), tool.name).toBeTruthy();
      expect(typeof tool.annotations?.readOnlyHint, tool.name).toBe('boolean');
      expect(typeof tool.annotations?.destructiveHint, tool.name).toBe('boolean');
      expect(typeof tool.annotations?.openWorldHint, tool.name).toBe('boolean');
    }
  });

  it('marks every tool read-only, non-destructive and closed-world', async () => {
    const client = await connect(single);
    const { tools } = await client.listTools();

    for (const tool of tools) {
      expect(tool.annotations, tool.name).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      });
    }
  });

  it('keeps the refinements out of the published schema of a refined tool', async () => {
    const client = await connect(single);
    const { tools } = await client.listTools();

    const query = tools.find((t) => t.name === 'query')!;
    expect(query.inputSchema.type).toBe('object');
    expect(query.inputSchema.required).toEqual(expect.arrayContaining(['timeRange', 'timezone', 'metrics']));
    expect(query.inputSchema.properties).toHaveProperty('metrics');
  });

  it('lists the dashboards in the context', async () => {
    const client = await connect(several);

    const result = await client.callTool({ name: 'list_dashboards', arguments: {} });
    expect(JSON.parse(text(result))).toEqual({
      dashboards: [
        { id: 'dash-shop', domain: 'shop.example.com', role: 'owner' },
        { id: 'dash-blog', domain: 'blog.example.com', role: 'viewer' },
      ],
    });
  });

  it('answers input its schema refuses with the refusal messages, not the raw validation error', async () => {
    const { executeListGlobalProperties } = await vi.importActual<typeof import('@/mcp/tools/globalProperties')>(
      '@/mcp/tools/globalProperties',
    );
    execute.executeListGlobalProperties.mockImplementation(executeListGlobalProperties);
    const client = await connect(single);

    const result = await client.callTool({ name: 'list_global_properties', arguments: { ...RANGE, key: 'gp.' } });
    expect(result.isError).toBe(true);
    expect(text(result)).toBe('Error: Invalid global property key: "gp."');
  });

  describe.each(DASHBOARD_TOOLS)('$name', ({ name, args, fn, ids }) => {
    const expectedIds = (dashboard: McpDashboard) => ids.map((key) => dashboard[key]);

    it("reads the only dashboard without a dashboardId, as today's tokens do", async () => {
      const client = await connect(single);

      const result = await client.callTool({ name, arguments: args });
      expect(result.isError).toBeFalsy();
      expect(fn).toHaveBeenCalledWith(
        expect.not.objectContaining({ dashboardId: expect.anything() }),
        ...expectedIds(SHOP),
      );
    });

    it('reads the dashboard named by dashboardId', async () => {
      const client = await connect(several);

      await client.callTool({ name, arguments: { ...args, dashboardId: 'dash-blog' } });
      expect(fn).toHaveBeenLastCalledWith(expect.anything(), ...expectedIds(BLOG));

      await client.callTool({ name, arguments: { ...args, dashboardId: 'dash-shop' } });
      expect(fn).toHaveBeenLastCalledWith(expect.anything(), ...expectedIds(SHOP));
    });

    it('asks for dashboardId when several dashboards are allowed', async () => {
      const client = await connect(several);

      const result = await client.callTool({ name, arguments: args });
      expect(result.isError).toBe(true);
      expect(text(result)).toContain('list_dashboards');
      expect(fn).not.toHaveBeenCalled();
    });

    it('answers a dashboard outside the allowed set like an unknown one', async () => {
      const client = await connect(single);

      const result = await client.callTool({ name, arguments: { ...args, dashboardId: 'dash-blog' } });
      expect(result.isError).toBe(true);
      expect(text(result)).toBe('Error: Dashboard not found');
      expect(fn).not.toHaveBeenCalled();
    });

    it('charges a site for valid arguments, the same site the call reads', async () => {
      const keys = await rateLimitKeys(
        several,
        dashboardToolNames(),
        toolCallRequest(name, { ...args, dashboardId: 'dash-blog' }),
      );
      expect(keys).toEqual(['site-blog']);
    });
  });

  // Invalid arguments of each tool, and the real execute function that has to refuse them before it reads anything.
  const CUSTOM_RANGE = { timeRange: 'custom', timezone: 'UTC' };
  const IMPOSSIBLE_DATE = { ...CUSTOM_RANGE, startDate: '2026-02-31', endDate: '2026-03-01' };
  const MISSING_DATE = { ...CUSTOM_RANGE, startDate: '2026-02-01' };
  const REVERSED_DATES = { ...CUSTOM_RANGE, startDate: '2026-03-01', endDate: '2026-02-01' };
  const rangeRejections = (extra: Record<string, unknown> = {}) => [
    { ...extra },
    { ...extra, ...IMPOSSIBLE_DATE },
    { ...extra, ...MISSING_DATE },
    { ...extra, ...REVERSED_DATES },
    { ...extra, ...RANGE, timezone: 'Not/AZone' },
  ];
  const INVALID_ARGS = [
    {
      name: 'query',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/query')>('@/mcp/tools/query')).executeQuery,
      cases: [
        ...rangeRejections({ metrics: ['visitors'] }),
        { ...RANGE, metrics: [] },
        { ...RANGE, metrics: ['nope'] },
      ],
    },
    {
      name: 'query_sessions',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/querySessions')>('@/mcp/tools/querySessions'))
          .executeQuerySessions,
      cases: [
        ...rangeRejections({ metrics: ['sessions'] }),
        { ...RANGE, metrics: [] },
        { ...RANGE, metrics: ['sessions'], orderBy: 'date' },
        { ...RANGE, metrics: ['sessions'], orderBy: 'bounce_rate' },
      ],
    },
    {
      name: 'user_journeys',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/userJourneys')>('@/mcp/tools/userJourneys'))
          .executeUserJourneys,
      cases: [...rangeRejections(), { ...RANGE, maxSteps: 1 }],
    },
    {
      name: 'funnel_preview',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/funnelPreview')>('@/mcp/tools/funnelPreview'))
          .executeFunnelPreview,
      cases: [...rangeRejections({ steps: [STEP, STEP] }), { ...RANGE, steps: [STEP] }],
    },
    {
      name: 'list_global_properties',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/globalProperties')>('@/mcp/tools/globalProperties'))
          .executeListGlobalProperties,
      cases: [...rangeRejections(), { ...RANGE, key: 'gp.' }, { ...RANGE, key: 'x'.repeat(65) }],
    },
    {
      name: 'list_funnels',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/listFunnels')>('@/mcp/tools/listFunnels'))
          .executeListFunnels,
      cases: rangeRejections(),
    },
    {
      name: 'list_errors',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/errors')>('@/mcp/tools/errors')).executeListErrors,
      cases: [...rangeRejections(), { ...RANGE, limit: 0 }, { ...IMPOSSIBLE_DATE, fingerprint: 'fp-1' }],
    },
    {
      name: 'get_error',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/errors')>('@/mcp/tools/errors')).executeGetError,
      cases: [{}, { fingerprint: 'fp-1', occurrenceOffset: -1 }],
    },
    {
      name: 'list_monitors',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/monitoring')>('@/mcp/tools/monitoring'))
          .executeListMonitors,
      cases: rangeRejections(),
    },
    {
      name: 'list_monitor_incidents',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/monitoring')>('@/mcp/tools/monitoring'))
          .executeListMonitorIncidents,
      cases: [...rangeRejections(), { ...RANGE, state: 'nope' }, { ...RANGE, limit: 0 }],
    },
    {
      name: 'list_status_pages',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/statusPages')>('@/mcp/tools/statusPages'))
          .executeListStatusPages,
      cases: [{ statusPageId: 1 }],
    },
    {
      name: 'list_incident_suggestions',
      load: async () =>
        (await vi.importActual<typeof import('@/mcp/tools/statusPages')>('@/mcp/tools/statusPages'))
          .executeListIncidentSuggestions,
      cases: [{ statusPageId: 1 }],
    },
  ];

  it('covers every dashboard-scoped tool in the invalid argument table', () => {
    expect(INVALID_ARGS.map((t) => t.name)).toEqual(DASHBOARD_TOOLS.map((t) => t.name));
  });

  describe.each(INVALID_ARGS)('$name with invalid arguments', ({ load, cases }) => {
    it.each(cases)('the tool refuses it before reading: %j', async (args) => {
      const executeTool = (await load()) as (input: unknown, ...ids: string[]) => Promise<unknown>;
      await expect(executeTool(args, 'site-blog', 'dash-blog')).rejects.toBeInstanceOf(z.ZodError);
    });
  });
});
