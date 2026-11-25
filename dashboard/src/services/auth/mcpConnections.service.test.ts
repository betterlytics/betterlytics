import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMcpConnections: vi.fn(),
  findMcpConsentGrant: vi.fn(),
  replaceMcpGrant: vi.fn(),
  deleteMcpConnection: vi.fn(),
  deleteAllMcpConnections: vi.fn(),
  findDashboardMcpConnections: vi.fn(),
  removeDashboardFromMcpGrant: vi.fn(),
  findUserMemberships: vi.fn(),
}));

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock('@/mcp/auth/oauth', () => ({ MCP_READ_SCOPE: 'dashboards:read' }));
vi.mock('@/repositories/postgres/mcpGrant.repository', () => ({
  findMcpConnections: mocks.findMcpConnections,
  findMcpConsentGrant: mocks.findMcpConsentGrant,
  replaceMcpGrant: mocks.replaceMcpGrant,
  deleteMcpConnection: mocks.deleteMcpConnection,
  deleteAllMcpConnections: mocks.deleteAllMcpConnections,
  findDashboardMcpConnections: mocks.findDashboardMcpConnections,
  removeDashboardFromMcpGrant: mocks.removeDashboardFromMcpGrant,
  touchMcpGrantLastUsed: vi.fn(),
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserMemberships: mocks.findUserMemberships,
}));
vi.mock('@/repositories/postgres/user.repository', () => ({}));

import {
  getDashboardMcpConnections,
  listMcpConnections,
  removeDashboardFromMcpConnection,
  revokeAllMcpConnections,
  revokeMcpConnection,
  updateMcpConnectionDashboards,
} from '@/services/auth/mcpConnections.service';

const MEMBERSHIPS = [
  {
    dashboardId: 'dash-b',
    siteId: 'site-b',
    domain: 'b.example.com',
    role: 'viewer' as const,
    aiAccessEnabled: true,
  },
  {
    dashboardId: 'dash-a',
    siteId: 'site-a',
    domain: 'a.example.com',
    role: 'owner' as const,
    aiAccessEnabled: true,
  },
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
    grant: { allDashboards: true, dashboardIds: [], excludedDashboardIds: [] },
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
        excludedDashboards: [],
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
        { id: 'dash-a', domain: 'a.example.com', role: 'owner', aiAccessEnabled: true },
        { id: 'dash-b', domain: 'b.example.com', role: 'viewer', aiAccessEnabled: true },
      ],
    });
  });
});

describe('revokeMcpConnection', () => {
  it("deletes the user's consents and tokens for the client", async () => {
    mocks.deleteMcpConnection.mockResolvedValue(2);

    await revokeMcpConnection('user-1', 'client-1');

    expect(mocks.deleteMcpConnection).toHaveBeenCalledWith('user-1', 'client-1');
    expect(mocks.deleteAllMcpConnections).not.toHaveBeenCalled();
  });

  it("refuses a client the user hasn't connected", async () => {
    mocks.deleteMcpConnection.mockResolvedValue(0);

    await expect(revokeMcpConnection('user-1', 'someone-elses')).rejects.toThrow('notFound');
  });
});

describe('revokeAllMcpConnections', () => {
  it("deletes every consent and token of the user's", async () => {
    mocks.deleteAllMcpConnections.mockResolvedValue(3);

    await revokeAllMcpConnections('user-1');

    expect(mocks.deleteAllMcpConnections).toHaveBeenCalledWith('user-1');
  });
});

describe('updateMcpConnectionDashboards', () => {
  it("replaces the grant of the user's latest consent for the client", async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({ consentId: 'consent-1', grant: null });
    const selection = { allDashboards: false, dashboardIds: ['dash-a'] };

    await updateMcpConnectionDashboards('user-1', 'client-1', selection);

    expect(mocks.findMcpConsentGrant).toHaveBeenCalledWith('user-1', 'client-1');
    expect(mocks.replaceMcpGrant).toHaveBeenCalledWith('consent-1', { ...selection, excludedDashboardIds: [] });
  });

  it("refuses a client the user hasn't connected", async () => {
    mocks.findMcpConsentGrant.mockResolvedValue(null);

    await expect(
      updateMcpConnectionDashboards('user-1', 'client-1', { allDashboards: true, dashboardIds: [] }),
    ).rejects.toThrow('notFound');
    expect(mocks.replaceMcpGrant).not.toHaveBeenCalled();
  });

  it('refuses a dashboard the user is not a member of', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({ consentId: 'consent-1', grant: null });

    await expect(
      updateMcpConnectionDashboards('user-1', 'client-1', { allDashboards: false, dashboardIds: ['dash-other'] }),
    ).rejects.toThrow('dashboardUnavailable');
    expect(mocks.replaceMcpGrant).not.toHaveBeenCalled();
  });
});

describe('updateMcpConnectionDashboards with AI access off', () => {
  const offA = () => [MEMBERSHIPS[0], { ...MEMBERSHIPS[1]!, aiAccessEnabled: false }];

  it('refuses newly picking a dashboard whose AI access is off', async () => {
    mocks.findUserMemberships.mockResolvedValue(offA());
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: false, dashboardIds: ['dash-b'], excludedDashboardIds: [] },
    });

    await expect(
      updateMcpConnectionDashboards('user-1', 'client-1', { allDashboards: false, dashboardIds: ['dash-a'] }),
    ).rejects.toThrow('aiAccessDisabled');
    expect(mocks.replaceMcpGrant).not.toHaveBeenCalled();
  });

  it('keeps a dashboard whose AI access is off that the connection already covers', async () => {
    mocks.findUserMemberships.mockResolvedValue(offA());
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: true, dashboardIds: [], excludedDashboardIds: [] },
    });
    const selection = { allDashboards: false, dashboardIds: ['dash-a', 'dash-b'] };

    await updateMcpConnectionDashboards('user-1', 'client-1', selection);
    expect(mocks.replaceMcpGrant).toHaveBeenCalledWith('consent-1', { ...selection, excludedDashboardIds: [] });
  });
});

describe('dashboards owners or admins removed from an All dashboards connection', () => {
  const removedA = {
    consentId: 'consent-1',
    grant: { allDashboards: true, dashboardIds: [], excludedDashboardIds: ['dash-a'] },
  };

  it('shows them to the member, apart from the dashboards the connection reads', async () => {
    mocks.findMcpConnections.mockResolvedValue([record({ grant: removedA.grant })]);

    const [connection] = (await listMcpConnections('user-1')).connections;

    expect(connection).toMatchObject({
      allDashboards: true,
      dashboards: [{ id: 'dash-b', domain: 'b.example.com' }],
      excludedDashboards: [{ id: 'dash-a', domain: 'a.example.com' }],
    });
  });

  it('keeps them removed when the member saves without ticking them again', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue(removedA);

    await updateMcpConnectionDashboards('user-1', 'client-1', {
      allDashboards: true,
      dashboardIds: [],
      excludedDashboardIds: ['dash-a'],
    });
    expect(mocks.replaceMcpGrant).toHaveBeenCalledWith('consent-1', {
      allDashboards: true,
      dashboardIds: [],
      excludedDashboardIds: ['dash-a'],
    });
  });

  it('adds one back when the member ticks it again', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue(removedA);

    await updateMcpConnectionDashboards('user-1', 'client-1', {
      allDashboards: true,
      dashboardIds: [],
      excludedDashboardIds: [],
    });
    expect(mocks.replaceMcpGrant).toHaveBeenCalledWith('consent-1', {
      allDashboards: true,
      dashboardIds: [],
      excludedDashboardIds: [],
    });
  });

  it("never lets a member's selection remove a dashboard owners or admins didn't", async () => {
    mocks.findMcpConsentGrant.mockResolvedValue(removedA);

    await updateMcpConnectionDashboards('user-1', 'client-1', {
      allDashboards: true,
      dashboardIds: [],
      excludedDashboardIds: ['dash-a', 'dash-b'],
    });
    expect(mocks.replaceMcpGrant).toHaveBeenCalledWith(
      'consent-1',
      expect.objectContaining({ excludedDashboardIds: ['dash-a'] }),
    );
  });
});

describe('getDashboardMcpConnections', () => {
  it("names each connection by its client and shows only its member and this dashboard's link", async () => {
    const connectedAt = new Date('2026-11-20T10:00:00Z');
    mocks.findDashboardMcpConnections.mockResolvedValue([
      {
        consentId: 'consent-1',
        client: { clientId: 'https://claude.ai/cimd', name: null, redirectUris: [], discovered: true },
        member: { name: 'Ada', email: 'ada@example.com' },
        connectedAt,
        lastUsedAt: null,
      },
    ]);

    expect(await getDashboardMcpConnections('dash-1')).toEqual([
      {
        consentId: 'consent-1',
        name: 'claude.ai',
        member: { name: 'Ada', email: 'ada@example.com' },
        connectedAt,
        lastUsedAt: null,
      },
    ]);
    expect(mocks.findDashboardMcpConnections).toHaveBeenCalledWith('dash-1');
  });
});

describe('removeDashboardFromMcpConnection', () => {
  it('takes only this dashboard out of the connection, without revoking it', async () => {
    mocks.removeDashboardFromMcpGrant.mockResolvedValue(1);

    await removeDashboardFromMcpConnection('dash-1', 'consent-1');

    expect(mocks.removeDashboardFromMcpGrant).toHaveBeenCalledWith('consent-1', 'dash-1');
    expect(mocks.deleteMcpConnection).not.toHaveBeenCalled();
  });

  it('reports a connection that no longer covers the dashboard', async () => {
    mocks.removeDashboardFromMcpGrant.mockResolvedValue(0);
    await expect(removeDashboardFromMcpConnection('dash-1', 'consent-1')).rejects.toThrow('notFound');
  });
});
