import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deleteAllMcpConnections,
  deleteMcpConnection,
  deleteOrphanedMcpTokens,
  findDashboardMcpConnections,
  findMcpConnections,
  removeDashboardFromMcpGrant,
  replaceMcpGrant,
} from '@/repositories/postgres/mcpGrant.repository';

const tx = vi.hoisted(() => ({
  oauthAccessToken: { deleteMany: vi.fn() },
  oauthRefreshToken: { deleteMany: vi.fn() },
  oauthConsent: { deleteMany: vi.fn() },
  mcpGrant: { upsert: vi.fn(), findFirst: vi.fn() },
  mcpGrantDashboard: { deleteMany: vi.fn(), createMany: vi.fn() },
  mcpGrantExcludedDashboard: { deleteMany: vi.fn(), createMany: vi.fn() },
}));
const prismaMock = vi.hoisted(() => ({
  oauthConsent: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation((run) => run(tx));
  tx.oauthConsent.deleteMany.mockResolvedValue({ count: 1 });
});

describe('deleteMcpConnection', () => {
  it("deletes only the user's consents and tokens for that client", async () => {
    expect(await deleteMcpConnection('user-1', 'client-1')).toBe(1);

    const where = { userId: 'user-1', clientId: 'client-1' };
    expect(tx.oauthAccessToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthRefreshToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthConsent.deleteMany).toHaveBeenCalledWith({ where });
  });
});

describe('deleteAllMcpConnections', () => {
  it("deletes every consent and token of the user's, and nobody else's", async () => {
    await deleteAllMcpConnections('user-1');

    const where = { userId: 'user-1' };
    expect(tx.oauthAccessToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthRefreshToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthConsent.deleteMany).toHaveBeenCalledWith({ where });
  });
});

describe('deleteOrphanedMcpTokens', () => {
  it("deletes the user's stored tokens for the client and leaves its consents", async () => {
    await deleteOrphanedMcpTokens('user-1', 'client-1');

    const where = { userId: 'user-1', clientId: 'client-1' };
    expect(tx.oauthAccessToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthRefreshToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthConsent.deleteMany).not.toHaveBeenCalled();
  });
});

describe('findMcpConnections', () => {
  const consent = (id: string, clientId: string, updatedAt: string) => ({
    id,
    scopes: ['dashboards:read'],
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date(updatedAt),
    client: { clientId, name: clientId, redirectUris: ['https://agent.example/cb'], clientDiscoveryId: null },
    grant: { allDashboards: true, lastUsedAt: null, dashboards: [], excludedDashboards: [] },
  });

  it("keeps the user's latest consent per enabled client, newest first", async () => {
    prismaMock.oauthConsent.findMany.mockResolvedValue([
      consent('consent-a2', 'client-a', '2026-11-20T10:00:00Z'),
      consent('consent-b', 'client-b', '2026-11-10T10:00:00Z'),
      consent('consent-a1', 'client-a', '2026-11-05T10:00:00Z'),
    ]);

    const connections = await findMcpConnections('user-1');

    expect(connections.map((connection) => connection.consentId)).toEqual(['consent-a2', 'consent-b']);
    expect(prismaMock.oauthConsent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', client: { OR: [{ disabled: false }, { disabled: null }] } },
        orderBy: { updatedAt: 'desc' },
      }),
    );
  });
});

describe('replaceMcpGrant', () => {
  beforeEach(() => {
    tx.mcpGrant.upsert.mockResolvedValue({ id: 'grant-1' });
  });

  it('stores the excluded dashboards of an All dashboards selection in place of the old ones', async () => {
    await replaceMcpGrant('consent-1', {
      allDashboards: true,
      dashboardIds: [],
      excludedDashboardIds: ['dash-1'],
    });

    expect(tx.mcpGrant.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { allDashboards: true } }));
    expect(tx.mcpGrantExcludedDashboard.deleteMany).toHaveBeenCalledWith({ where: { grantId: 'grant-1' } });
    expect(tx.mcpGrantExcludedDashboard.createMany).toHaveBeenCalledWith({
      data: [{ grantId: 'grant-1', dashboardId: 'dash-1' }],
    });
  });

  it('stores no excluded dashboards for picked dashboards', async () => {
    await replaceMcpGrant('consent-1', {
      allDashboards: false,
      dashboardIds: ['dash-2'],
      excludedDashboardIds: ['dash-1'],
    });

    expect(tx.mcpGrantExcludedDashboard.deleteMany).toHaveBeenCalledWith({ where: { grantId: 'grant-1' } });
    expect(tx.mcpGrantExcludedDashboard.createMany).not.toHaveBeenCalled();
  });
});

describe('findDashboardMcpConnections', () => {
  const consent = (
    id: string,
    userId: string,
    clientId: string,
    grant: { allDashboards: boolean; picked?: boolean; excluded?: boolean } | null,
  ) => ({
    id,
    userId,
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date('2026-11-02T10:00:00Z'),
    user: { name: null, email: `${userId}@example.com` },
    client: { clientId, name: clientId, redirectUris: [], clientDiscoveryId: null },
    grant: grant && {
      allDashboards: grant.allDashboards,
      lastUsedAt: null,
      dashboards: grant.picked ? [{ dashboardId: 'dash-1' }] : [],
      excludedDashboards: grant.excluded ? [{ dashboardId: 'dash-1' }] : [],
    },
  });

  it("returns each grant with only its links to this dashboard, and the member's name", async () => {
    prismaMock.oauthConsent.findMany.mockResolvedValue([
      consent('picked', 'user-1', 'client-a', { allDashboards: false, picked: true }),
      consent('excluded', 'user-2', 'client-a', { allDashboards: true, excluded: true }),
      consent('no-grant', 'user-3', 'client-a', null),
    ]);

    const connections = await findDashboardMcpConnections('dash-1');

    expect(connections.map(({ consentId, grant }) => ({ consentId, grant }))).toEqual([
      { consentId: 'picked', grant: { allDashboards: false, dashboardIds: ['dash-1'], excludedDashboardIds: [] } },
      {
        consentId: 'excluded',
        grant: { allDashboards: true, dashboardIds: [], excludedDashboardIds: ['dash-1'] },
      },
      { consentId: 'no-grant', grant: null },
    ]);
    expect(connections[0]!.member).toEqual({ name: null, email: 'user-1@example.com' });
  });

  it("reads only the latest consent per member and client, and only members' with this dashboard", async () => {
    prismaMock.oauthConsent.findMany.mockResolvedValue([
      consent('latest', 'user-1', 'client-a', { allDashboards: false }),
      consent('older', 'user-1', 'client-a', { allDashboards: true }),
    ]);

    expect((await findDashboardMcpConnections('dash-1')).map((connection) => connection.consentId)).toEqual([
      'latest',
    ]);
    expect(prismaMock.oauthConsent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          client: { OR: [{ disabled: false }, { disabled: null }] },
          user: {
            deletedAt: null,
            disabledAt: null,
            dashboardAccess: { some: { dashboardId: 'dash-1', deletedAt: null } },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    );
  });
});

describe('removeDashboardFromMcpGrant', () => {
  it('excludes the dashboard from an All dashboards grant, which keeps covering the others', async () => {
    tx.mcpGrant.findFirst.mockResolvedValue({ id: 'grant-1', allDashboards: true });
    tx.mcpGrantExcludedDashboard.createMany.mockResolvedValue({ count: 1 });

    expect(await removeDashboardFromMcpGrant('consent-1', 'dash-1')).toBe(1);
    expect(tx.mcpGrantExcludedDashboard.createMany).toHaveBeenCalledWith({
      data: [{ grantId: 'grant-1', dashboardId: 'dash-1' }],
      skipDuplicates: true,
    });
    expect(tx.mcpGrantDashboard.deleteMany).not.toHaveBeenCalled();
    expect(tx.oauthConsent.deleteMany).not.toHaveBeenCalled();
  });

  it('succeeds again for an All dashboards grant that already excludes the dashboard', async () => {
    tx.mcpGrant.findFirst.mockResolvedValue({ id: 'grant-1', allDashboards: true });
    tx.mcpGrantExcludedDashboard.createMany.mockResolvedValue({ count: 0 });

    expect(await removeDashboardFromMcpGrant('consent-1', 'dash-1')).toBe(1);
  });

  it('drops the dashboard from a picked grant and leaves the consent, even with no dashboards left', async () => {
    tx.mcpGrant.findFirst.mockResolvedValue({ id: 'grant-1', allDashboards: false });
    tx.mcpGrantDashboard.deleteMany.mockResolvedValue({ count: 1 });

    expect(await removeDashboardFromMcpGrant('consent-1', 'dash-1')).toBe(1);
    expect(tx.mcpGrantDashboard.deleteMany).toHaveBeenCalledWith({
      where: { grantId: 'grant-1', dashboardId: 'dash-1' },
    });
    expect(tx.oauthConsent.deleteMany).not.toHaveBeenCalled();
  });

  it('only touches a consent of a member of the dashboard', async () => {
    tx.mcpGrant.findFirst.mockResolvedValue(null);

    expect(await removeDashboardFromMcpGrant('consent-1', 'dash-1')).toBe(0);
    expect(tx.mcpGrant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          consentId: 'consent-1',
          consent: { user: { dashboardAccess: { some: { dashboardId: 'dash-1', deletedAt: null } } } },
        },
      }),
    );
  });
});
