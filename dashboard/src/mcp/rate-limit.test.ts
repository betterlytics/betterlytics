import { describe, it, expect, vi } from 'vitest';
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

const toolCall = (name: string, args: Record<string, unknown>, id = 1) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args },
});

describe('rateLimitKeys', () => {
  it('counts every request of a single-dashboard credential against its site without reading the body', async () => {
    const readBody = vi.fn();

    expect(await rateLimitKeys(single, readBody)).toEqual(['site-shop']);
    expect(readBody).not.toHaveBeenCalled();
  });

  it('counts a tool call against the site of the dashboard it names', async () => {
    const keys = await rateLimitKeys(several, async () => toolCall('query', { dashboardId: 'dash-blog' }));
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
      expect(await rateLimitKeys(several, async () => body)).toEqual(['mcp-token:2']);
    }
  });

  it('counts a dashboardId outside the allowed set against the credential', async () => {
    const keys = await rateLimitKeys(several, async () => toolCall('query', { dashboardId: 'site-blog' }));
    expect(keys).toEqual(['mcp-token:2']);
  });

  it('falls back to the credential when the body is not JSON', async () => {
    const keys = await rateLimitKeys(several, () => Promise.reject(new SyntaxError('Unexpected token')));
    expect(keys).toEqual(['mcp-token:2']);
  });

  it('counts each message of a batch against the site it reads', async () => {
    const keys = await rateLimitKeys(several, async () => [
      toolCall('query', { dashboardId: 'dash-shop' }, 1),
      toolCall('query', { dashboardId: 'dash-blog' }, 2),
      toolCall('describe', {}, 3),
    ]);
    expect(keys).toEqual(['site-shop', 'site-blog', 'mcp-token:2']);
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
});
