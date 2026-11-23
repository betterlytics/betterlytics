import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMcpConnections: vi.fn(),
  findMcpConsentGrant: vi.fn(),
  replaceMcpGrant: vi.fn(),
  deleteMcpConnections: vi.fn(),
  findUserMemberships: vi.fn(),
}));

vi.mock('@/mcp/auth/oauth', () => ({ MCP_READ_SCOPE: 'dashboards:read' }));
vi.mock('@/repositories/postgres/mcpGrant.repository', () => ({
  findMcpConnections: mocks.findMcpConnections,
  findMcpConsentGrant: mocks.findMcpConsentGrant,
  replaceMcpGrant: mocks.replaceMcpGrant,
  deleteMcpConnections: mocks.deleteMcpConnections,
  touchMcpGrantLastUsed: vi.fn(),
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserMemberships: mocks.findUserMemberships,
}));
vi.mock('@/repositories/postgres/user.repository', () => ({}));

import {
  listMcpConnections,
  revokeAllMcpConnections,
  revokeMcpConnection,
  updateMcpConnectionDashboards,
} from '@/services/auth/mcpConnections.service';

const MEMBERSHIPS = [
  { dashboardId: 'dash-b', siteId: 'site-b', domain: 'b.example.com', role: 'viewer' as const },
  { dashboardId: 'dash-a', siteId: 'site-a', domain: 'a.example.com', role: 'owner' as const },
];

const CONNECTED = new Date('2026-11-01T10:00:00Z');
const USED = new Date('2026-11-20T10:00:00Z');

function record(overrides: Record<string, unknown> = {}) {
  return {
    consentId: 'consent-1',
    client: {
      clientId: 'https://claude.ai/oauth/mcp-client.json',
      name: 'Claude',
      redirectUris: ['https://claude.ai/api/mcp/auth_callback'],
      discovered: true,
    },
    scopes: ['openid', 'dashboards:read'],
    connectedAt: CONNECTED,
    lastUsedAt: USED,
    grant: { allDashboards: true, dashboardIds: [] },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUserMemberships.mockResolvedValue(MEMBERSHIPS);
});

describe('listMcpConnections', () => {
  it('names a CIMD client by its client_id host, verified, with a label per known scope', async () => {
    mocks.findMcpConnections.mockResolvedValue([record()]);

    const { connections } = await listMcpConnections('user-1');

    expect(connections).toEqual([
      {
        clientId: 'https://claude.ai/oauth/mcp-client.json',
        name: 'Claude',
        host: 'claude.ai',
        verified: true,
        scopes: ['readAnalytics'],
        allDashboards: true,
        dashboards: [
          { id: 'dash-a', domain: 'a.example.com' },
          { id: 'dash-b', domain: 'b.example.com' },
        ],
        connectedAt: CONNECTED,
        lastUsedAt: USED,
      },
    ]);
    expect(mocks.findMcpConnections).toHaveBeenCalledWith('user-1');
  });

  it('shows a DCR client unverified, under its first redirect host, and named by it when it gave no name', async () => {
    mocks.findMcpConnections.mockResolvedValue([
      record({
        client: {
          clientId: 'random-id',
          name: '  ',
          redirectUris: ['http://127.0.0.1:33418/callback', 'https://other.example/cb'],
          discovered: false,
        },
        lastUsedAt: null,
      }),
    ]);

    const [connection] = (await listMcpConnections('user-1')).connections;

    expect(connection).toMatchObject({ name: '127.0.0.1:33418', host: '127.0.0.1:33418', verified: false });
    expect(connection!.lastUsedAt).toBeNull();
  });

  it('hides picked dashboards the user is no longer a member of', async () => {
    mocks.findMcpConnections.mockResolvedValue([
      record({ grant: { allDashboards: false, dashboardIds: ['dash-b', 'dash-left'] } }),
    ]);

    const [connection] = (await listMcpConnections('user-1')).connections;

    expect(connection).toMatchObject({
      allDashboards: false,
      dashboards: [{ id: 'dash-b', domain: 'b.example.com' }],
    });
  });

  it('lists no dashboards for a consent without a grant', async () => {
    mocks.findMcpConnections.mockResolvedValue([record({ grant: null })]);

    const [connection] = (await listMcpConnections('user-1')).connections;

    expect(connection).toMatchObject({ allDashboards: false, dashboards: [] });
  });

  it('offers every dashboard the user is a member of for editing, by domain', async () => {
    mocks.findMcpConnections.mockResolvedValue([]);

    expect(await listMcpConnections('user-1')).toEqual({
      connections: [],
      dashboards: [
        { id: 'dash-a', domain: 'a.example.com', role: 'owner' },
        { id: 'dash-b', domain: 'b.example.com', role: 'viewer' },
      ],
    });
  });
});

describe('revokeMcpConnection', () => {
  it("deletes the user's consents and tokens for the client", async () => {
    mocks.deleteMcpConnections.mockResolvedValue(2);

    await revokeMcpConnection('user-1', 'client-1');

    expect(mocks.deleteMcpConnections).toHaveBeenCalledWith('user-1', 'client-1');
  });

  it("refuses a client the user hasn't connected", async () => {
    mocks.deleteMcpConnections.mockResolvedValue(0);

    await expect(revokeMcpConnection('user-1', 'someone-elses')).rejects.toThrow('no longer exists');
  });
});

describe('revokeAllMcpConnections', () => {
  it("deletes every consent and token of the user's", async () => {
    mocks.deleteMcpConnections.mockResolvedValue(3);

    await revokeAllMcpConnections('user-1');

    expect(mocks.deleteMcpConnections).toHaveBeenCalledWith('user-1');
  });
});

describe('updateMcpConnectionDashboards', () => {
  it("replaces the grant of the user's latest consent for the client", async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({ consentId: 'consent-1', grant: null });
    const selection = { allDashboards: false, dashboardIds: ['dash-a'] };

    await updateMcpConnectionDashboards('user-1', 'client-1', selection);

    expect(mocks.findMcpConsentGrant).toHaveBeenCalledWith('user-1', 'client-1');
    expect(mocks.replaceMcpGrant).toHaveBeenCalledWith('consent-1', selection);
  });

  it("refuses a client the user hasn't connected", async () => {
    mocks.findMcpConsentGrant.mockResolvedValue(null);

    await expect(
      updateMcpConnectionDashboards('user-1', 'client-1', { allDashboards: true, dashboardIds: [] }),
    ).rejects.toThrow('no longer exists');
    expect(mocks.replaceMcpGrant).not.toHaveBeenCalled();
  });

  it('refuses a dashboard the user is not a member of', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({ consentId: 'consent-1', grant: null });

    await expect(
      updateMcpConnectionDashboards('user-1', 'client-1', { allDashboards: false, dashboardIds: ['dash-other'] }),
    ).rejects.toThrow('no longer available');
    expect(mocks.replaceMcpGrant).not.toHaveBeenCalled();
  });
});
