import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { checkMcpRateLimit, rateLimitKeys } from '@/mcp/rate-limit';
import type { McpContext } from '@/mcp/context';

const SHOP = { dashboardId: 'dash-shop', siteId: 'site-shop', domain: 'shop.example.com', role: 'owner' as const };
const BLOG = {
  dashboardId: 'dash-blog',
  siteId: 'site-blog',
  domain: 'blog.example.com',
  role: 'viewer' as const,
};

const single: McpContext = { credentialId: 'mcp-token:1', dashboards: [SHOP] };
const several: McpContext = { credentialId: 'mcp-token:2', dashboards: [SHOP, BLOG] };

const DASHBOARD_TOOLS = new Map<string, z.ZodTypeAny>([
  ['query', z.object({ metrics: z.array(z.string()).min(1) }).refine((args) => args.metrics[0] !== 'refused')],
]);
const QUERY_ARGS = { metrics: ['visitors'] };

const toolCall = (name: string, args: Record<string, unknown>, id = 1) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args },
});

const TRANSPORT_HEADERS = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };

const mcpRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: { ...TRANSPORT_HEADERS, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const keysFor = (body: unknown, headers?: Record<string, string>) =>
  rateLimitKeys(several, DASHBOARD_TOOLS, mcpRequest(body, headers));

describe('rateLimitKeys', () => {
  it('counts every request of a single-dashboard credential against its site without reading the body', async () => {
    const req = mcpRequest(toolCall('query', QUERY_ARGS));
    const clone = vi.spyOn(req, 'clone');
    const json = vi.spyOn(req, 'json');

    expect(await rateLimitKeys(single, DASHBOARD_TOOLS, req)).toEqual(['site-shop']);
    expect(clone).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });

  it('counts a tool call against the site of the dashboard it names', async () => {
    expect(await keysFor(toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-blog' }))).toEqual(['site-blog']);
  });

  it.each([
    ['fail the field checks', { metrics: [] }],
    ['fail a refinement', { metrics: ['refused'] }],
    ['are missing', {}],
  ])('counts a call against the credential when its arguments %s', async (_label, args) => {
    expect(await keysFor(toolCall('query', { ...args, dashboardId: 'dash-blog' }))).toEqual(['mcp-token:2']);
  });

  it('counts a notification against the credential, as it never runs', async () => {
    const notification = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: 'query', arguments: { ...QUERY_ARGS, dashboardId: 'dash-blog' } },
    };
    expect(await keysFor(notification)).toEqual(['mcp-token:2']);
  });

  it('counts a task-augmented call against the credential, as this server refuses it', async () => {
    const call = toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-blog' });
    const keys = await keysFor({ ...call, params: { ...call.params, task: { ttl: 1000 } } });
    expect(keys).toEqual(['mcp-token:2']);
  });

  it.each([
    ['a malformed message', { jsonrpc: '1.0', id: 2, method: 'tools/list' }],
    [
      'an initialize',
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'initialize',
        params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'c', version: '1' } },
      },
    ],
  ])(
    'counts a whole batch against the credential when %s makes the transport reject it',
    async (_label, other) => {
      const keys = await keysFor([toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-blog' }), other]);
      expect(keys).toEqual(['mcp-token:2', 'mcp-token:2']);
    },
  );

  it.each([
    ['an Accept without event streams', { accept: 'application/json' }],
    ['an Accept without JSON', { accept: 'text/event-stream' }],
    ['a Content-Type that is not JSON', { 'content-type': 'text/plain' }],
    ['an unsupported protocol version', { 'mcp-protocol-version': '1999-01-01' }],
  ])('counts a call against the credential when %s makes the transport reject it', async (_label, headers) => {
    const keys = await keysFor(toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-blog' }), headers);
    expect(keys).toEqual(['mcp-token:2']);
  });

  it.each([
    ['a Content-Type with a charset', { 'content-type': 'application/json; charset=utf-8' }],
    ['a supported protocol version', { 'mcp-protocol-version': '2025-06-18' }],
  ])('still counts a call against the site with %s', async (_label, headers) => {
    const keys = await keysFor(toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-blog' }), headers);
    expect(keys).toEqual(['site-blog']);
  });

  it('counts calls that read no dashboard against the credential', async () => {
    const bodies = [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      toolCall('describe', {}),
      toolCall('list_dashboards', {}),
      toolCall('query', {}),
    ];
    for (const body of bodies) {
      expect(await keysFor(body)).toEqual(['mcp-token:2']);
    }
  });

  it('counts describe and list_dashboards against the credential even when they are given a dashboardId', async () => {
    for (const name of ['describe', 'list_dashboards']) {
      expect(await keysFor(toolCall(name, { dashboardId: 'dash-blog' }))).toEqual(['mcp-token:2']);
    }
  });

  it('counts a tool that is not registered against the credential even when it is given a dashboardId', async () => {
    expect(await keysFor(toolCall('no_such_tool', { dashboardId: 'dash-blog' }))).toEqual(['mcp-token:2']);
  });

  it('counts a dashboardId outside the allowed set against the credential', async () => {
    expect(await keysFor(toolCall('query', { ...QUERY_ARGS, dashboardId: 'site-blog' }))).toEqual(['mcp-token:2']);
  });

  it('falls back to the credential when the body is not JSON', async () => {
    expect(await keysFor('not json')).toEqual(['mcp-token:2']);
  });

  it('counts each message of a batch against the site it reads', async () => {
    const keys = await keysFor([
      toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-shop' }, 1),
      toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-blog' }, 2),
      toolCall('describe', {}, 3),
    ]);
    expect(keys).toEqual(['site-shop', 'site-blog', 'mcp-token:2']);
  });

  it('leaves the request body for the transport to read', async () => {
    const req = mcpRequest(toolCall('query', { ...QUERY_ARGS, dashboardId: 'dash-blog' }));

    await rateLimitKeys(several, DASHBOARD_TOOLS, req);

    expect((await req.json()).id).toBe(1);
  });
});

describe('checkMcpRateLimit', () => {
  it('allows 60 requests per key a minute and then reports when to retry', () => {
    for (let i = 0; i < 60; i++) {
      expect(checkMcpRateLimit(['site-limit-a']).allowed).toBe(true);
    }

    const blocked = checkMcpRateLimit(['site-limit-a']);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);

    // Another site is counted separately.
    expect(checkMcpRateLimit(['site-limit-b']).allowed).toBe(true);
  });

  it('records nothing for any key when one of them is over its limit', () => {
    for (let i = 0; i < 60; i++) checkMcpRateLimit(['site-full']);

    expect(checkMcpRateLimit(['site-free', 'mcp-token:free', 'site-full']).allowed).toBe(false);

    for (let i = 0; i < 60; i++) {
      expect(checkMcpRateLimit(['site-free', 'mcp-token:free']).allowed).toBe(true);
    }
    expect(checkMcpRateLimit(['site-free']).allowed).toBe(false);
  });
});
