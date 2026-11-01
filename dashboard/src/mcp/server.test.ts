import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
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

import { createMcpServer } from '@/mcp/server';

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

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(execute)) fn.mockResolvedValue({ ok: true });
});

describe('createMcpServer', () => {
  const several: McpContext = { credentialId: 'mcp-token:2', dashboards: [SHOP, BLOG] };
  const single: McpContext = { credentialId: 'mcp-token:1', dashboards: [SHOP] };

  it('registers every dashboard-scoped tool with an optional dashboardId and a description pointing to it', async () => {
    const client = await connect(single);
    const { tools } = await client.listTools();

    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(['describe', 'list_dashboards', ...DASHBOARD_TOOLS.map((t) => t.name)]),
    );
    expect(tools).toHaveLength(DASHBOARD_TOOLS.length + 2);

    for (const tool of tools) {
      expect(tool.description, tool.name).toContain('dashboardId');
      if (tool.name !== 'list_dashboards') expect(tool.description, tool.name).toContain('list_dashboards');
      if (tool.name === 'describe' || tool.name === 'list_dashboards') {
        expect(tool.inputSchema.properties ?? {}, tool.name).not.toHaveProperty('dashboardId');
        continue;
      }
      expect(tool.inputSchema.properties, tool.name).toHaveProperty('dashboardId');
      expect(tool.inputSchema.required ?? [], tool.name).not.toContain('dashboardId');
    }
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
  });
});
