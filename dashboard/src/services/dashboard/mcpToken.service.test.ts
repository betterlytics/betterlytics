import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  createMcpToken: vi.fn(),
  findPersonalMcpTokens: vi.fn(),
  replaceMcpTokenDashboards: vi.fn(),
  deletePersonalMcpToken: vi.fn(),
  removeDashboardFromMcpToken: vi.fn(),
  findDashboardMcpTokens: vi.fn(),
  findUserMemberships: vi.fn(),
}));

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock('@/repositories/postgres/mcpToken.repository', () => ({
  createMcpToken: mocks.createMcpToken,
  findPersonalMcpTokens: mocks.findPersonalMcpTokens,
  replaceMcpTokenDashboards: mocks.replaceMcpTokenDashboards,
  deletePersonalMcpToken: mocks.deletePersonalMcpToken,
  removeDashboardFromMcpToken: mocks.removeDashboardFromMcpToken,
  findDashboardMcpTokens: mocks.findDashboardMcpTokens,
  updateMcpTokenLastUsed: vi.fn(),
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserMemberships: mocks.findUserMemberships,
}));
vi.mock('@/repositories/postgres/mcpGrant.repository', () => ({}));
vi.mock('@/repositories/postgres/user.repository', () => ({}));

import {
  createPersonalMcpToken,
  hashToken,
  listPersonalMcpTokens,
  removeDashboardFromToken,
  revokePersonalMcpToken,
  updatePersonalMcpTokenDashboards,
} from '@/services/dashboard/mcpToken.service';

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

const CREATED = {
  id: 'token-1',
  name: 'CI',
  createdAt: new Date('2026-11-01'),
  lastUsedAt: null,
  expiresAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUserMemberships.mockResolvedValue(MEMBERSHIPS);
  mocks.createMcpToken.mockResolvedValue(CREATED);
});

describe('createPersonalMcpToken', () => {
  it('lets a viewer create a token for their dashboard and stores only its hash', async () => {
    const created = await createPersonalMcpToken('user-1', 'CI', ['dash-b'], '90d');

    expect(created.plainToken).toMatch(/^btl_[0-9a-f]{32}$/);
    const [data, tokenHash] = mocks.createMcpToken.mock.calls[0]!;
    expect(tokenHash).toBe(hashToken(created.plainToken));
    expect(data).toEqual({
      name: 'CI',
      createdBy: 'user-1',
      dashboardIds: ['dash-b'],
      expiresAt: expect.any(Date),
    });
    const days = (data.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(Math.round(days)).toBe(90);
  });

  it('stores no expiry for a token that never expires', async () => {
    await createPersonalMcpToken('user-1', 'CI', ['dash-a'], 'never');
    expect(mocks.createMcpToken.mock.calls[0]![0].expiresAt).toBeNull();
  });

  it('refuses a dashboard whose AI access is off', async () => {
    mocks.findUserMemberships.mockResolvedValue([{ ...MEMBERSHIPS[0]!, aiAccessEnabled: false }]);
    await expect(createPersonalMcpToken('user-1', 'CI', ['dash-b'], '90d')).rejects.toThrow('aiAccessDisabled');
    expect(mocks.createMcpToken).not.toHaveBeenCalled();
  });

  it('refuses a dashboard the user is not a member of', async () => {
    await expect(createPersonalMcpToken('user-1', 'CI', ['dash-a', 'dash-other'], '30d')).rejects.toThrow(
      'dashboardUnavailable',
    );
    expect(mocks.createMcpToken).not.toHaveBeenCalled();
  });
});

describe('listPersonalMcpTokens', () => {
  it('shows only the picked dashboards the user is still a member of, by domain', async () => {
    mocks.findPersonalMcpTokens.mockResolvedValue([
      { ...CREATED, dashboardIds: ['dash-b', 'dash-left', 'dash-a'] },
    ]);

    expect(await listPersonalMcpTokens('user-1')).toEqual({
      tokens: [
        {
          ...CREATED,
          dashboards: [
            { id: 'dash-a', domain: 'a.example.com' },
            { id: 'dash-b', domain: 'b.example.com' },
          ],
        },
      ],
      dashboards: [
        { id: 'dash-a', domain: 'a.example.com', role: 'owner', aiAccessEnabled: true },
        { id: 'dash-b', domain: 'b.example.com', role: 'viewer', aiAccessEnabled: true },
      ],
    });
  });
});

describe('updatePersonalMcpTokenDashboards', () => {
  beforeEach(() => {
    mocks.findPersonalMcpTokens.mockResolvedValue([{ ...CREATED, dashboardIds: ['dash-b'] }]);
  });

  it("replaces the token's dashboards", async () => {
    mocks.replaceMcpTokenDashboards.mockResolvedValue(true);

    await updatePersonalMcpTokenDashboards('user-1', 'token-1', ['dash-a']);
    expect(mocks.replaceMcpTokenDashboards).toHaveBeenCalledWith('token-1', 'user-1', ['dash-a']);
  });

  it('refuses a dashboard the user is not a member of', async () => {
    await expect(updatePersonalMcpTokenDashboards('user-1', 'token-1', ['dash-other'])).rejects.toThrow(
      'dashboardUnavailable',
    );
    expect(mocks.replaceMcpTokenDashboards).not.toHaveBeenCalled();
  });

  it("refuses another user's token", async () => {
    mocks.findPersonalMcpTokens.mockResolvedValue([]);

    await expect(updatePersonalMcpTokenDashboards('user-1', 'token-1', ['dash-a'])).rejects.toThrow('notFound');
    expect(mocks.replaceMcpTokenDashboards).not.toHaveBeenCalled();
  });

  it('refuses newly picking a dashboard whose AI access is off', async () => {
    mocks.findUserMemberships.mockResolvedValue([MEMBERSHIPS[0], { ...MEMBERSHIPS[1]!, aiAccessEnabled: false }]);

    await expect(updatePersonalMcpTokenDashboards('user-1', 'token-1', ['dash-b', 'dash-a'])).rejects.toThrow(
      'aiAccessDisabled',
    );
    expect(mocks.replaceMcpTokenDashboards).not.toHaveBeenCalled();
  });

  it('keeps a picked dashboard whose AI access is off when the others change', async () => {
    mocks.findPersonalMcpTokens.mockResolvedValue([{ ...CREATED, dashboardIds: ['dash-a'] }]);
    mocks.findUserMemberships.mockResolvedValue([MEMBERSHIPS[0], { ...MEMBERSHIPS[1]!, aiAccessEnabled: false }]);
    mocks.replaceMcpTokenDashboards.mockResolvedValue(true);

    await updatePersonalMcpTokenDashboards('user-1', 'token-1', ['dash-a', 'dash-b']);
    expect(mocks.replaceMcpTokenDashboards).toHaveBeenCalledWith('token-1', 'user-1', ['dash-a', 'dash-b']);
  });
});

describe('revoking', () => {
  it("refuses deleting another user's token", async () => {
    mocks.deletePersonalMcpToken.mockResolvedValue(0);
    await expect(revokePersonalMcpToken('user-1', 'token-1')).rejects.toThrow('notFound');
  });

  it('removes one dashboard from a token', async () => {
    mocks.removeDashboardFromMcpToken.mockResolvedValue(1);
    await removeDashboardFromToken('dash-1', 'token-1');
    expect(mocks.removeDashboardFromMcpToken).toHaveBeenCalledWith('token-1', 'dash-1');
  });

  it('reports a token that no longer covers the dashboard', async () => {
    mocks.removeDashboardFromMcpToken.mockResolvedValue(0);
    await expect(removeDashboardFromToken('dash-1', 'token-1')).rejects.toThrow('notFound');
  });
});
