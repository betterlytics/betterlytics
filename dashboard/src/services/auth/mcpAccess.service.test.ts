import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUserById: vi.fn(),
  findMcpConsentGrant: vi.fn(),
  touchMcpGrantLastUsed: vi.fn(),
  findUserMemberships: vi.fn(),
  updateMcpTokenLastUsed: vi.fn(),
}));

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock('@/repositories/postgres/user.repository', () => ({ findUserById: mocks.findUserById }));
vi.mock('@/repositories/postgres/mcpGrant.repository', () => ({
  findMcpConsentGrant: mocks.findMcpConsentGrant,
  touchMcpGrantLastUsed: mocks.touchMcpGrantLastUsed,
}));
vi.mock('@/repositories/postgres/mcpToken.repository', () => ({
  updateMcpTokenLastUsed: mocks.updateMcpTokenLastUsed,
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserMemberships: mocks.findUserMemberships,
}));

import {
  assertPickedDashboardsAvailable,
  grantedDashboards,
  resolveOAuthMcpContext,
  resolveTokenMcpContext,
} from '@/services/auth/mcpAccess.service';

const MEMBERSHIPS = [
  { dashboardId: 'dash-new', siteId: 'site-new', domain: 'new.example.com', role: 'owner' as const },
  { dashboardId: 'dash-a', siteId: 'site-a', domain: 'a.example.com', role: 'viewer' as const },
];

const ISSUED_AT = 1_795_000_000;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUserById.mockResolvedValue({ id: 'user-1', deletedAt: null, disabledAt: null });
  mocks.findUserMemberships.mockResolvedValue(MEMBERSHIPS);
  mocks.touchMcpGrantLastUsed.mockResolvedValue(undefined);
});

describe('grantedDashboards', () => {
  it('reads every membership, joined later or not, under All dashboards', () => {
    expect(
      grantedDashboards({ allDashboards: true, dashboardIds: [] }, MEMBERSHIPS).map((d) => d.dashboardId),
    ).toEqual(['dash-new', 'dash-a']);
  });

  it('reads only the picked dashboards the user is still a member of, with the current role', () => {
    expect(
      grantedDashboards({ allDashboards: false, dashboardIds: ['dash-a', 'dash-left'] }, MEMBERSHIPS),
    ).toEqual([{ dashboardId: 'dash-a', siteId: 'site-a', domain: 'a.example.com', role: 'viewer' }]);
  });

  it('reads nothing for a consent without a grant', () => {
    expect(grantedDashboards(null, MEMBERSHIPS)).toEqual([]);
  });
});

describe('resolveOAuthMcpContext', () => {
  it("keys the context on the consent and lists the grant's dashboards", async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: false, dashboardIds: ['dash-a'] },
    });

    expect(await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT)).toEqual({
      credentialId: 'oauth-consent:consent-1',
      dashboards: [MEMBERSHIPS[1]],
    });
    expect(mocks.findMcpConsentGrant).toHaveBeenCalledWith('user-1', 'client-1');
  });

  it('stays valid with an empty list when the user left every picked dashboard', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: false, dashboardIds: ['dash-left'] },
    });

    expect(await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT)).toEqual({
      credentialId: 'oauth-consent:consent-1',
      dashboards: [],
    });
  });

  it.each([
    ['the consent was revoked', null, { deletedAt: null, disabledAt: null }],
    ['the user is disabled', { consentId: 'c', grant: null }, { deletedAt: null, disabledAt: new Date() }],
    ['the user is deleted', { consentId: 'c', grant: null }, { deletedAt: new Date(), disabledAt: null }],
  ])('authorizes nothing once %s', async (_case, consent, user) => {
    mocks.findMcpConsentGrant.mockResolvedValue(consent);
    mocks.findUserById.mockResolvedValue({ id: 'user-1', ...user });

    expect(await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT)).toBeNull();
    expect(mocks.touchMcpGrantLastUsed).not.toHaveBeenCalled();
  });

  it('refuses a token issued before the consent: revoked, then the client connected again', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-2',
      createdAt: new Date((ISSUED_AT + 1) * 1000),
      grant: { allDashboards: true, dashboardIds: [] },
    });

    expect(await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT)).toBeNull();
    expect(mocks.touchMcpGrantLastUsed).not.toHaveBeenCalled();
  });

  it('accepts a token issued in the second the consent was created', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      createdAt: new Date(ISSUED_AT * 1000),
      grant: { allDashboards: true, dashboardIds: [] },
    });

    expect(await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT)).toEqual({
      credentialId: 'oauth-consent:consent-1',
      dashboards: MEMBERSHIPS,
    });
  });

  it('records the use on the consent it authorized', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({ consentId: 'consent-1', grant: null });

    await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT);

    expect(mocks.touchMcpGrantLastUsed).toHaveBeenCalledWith('consent-1');
  });

  it('still authorizes the call when recording the use fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: true, dashboardIds: [] },
    });
    mocks.touchMcpGrantLastUsed.mockRejectedValue(new Error('database down'));

    expect(await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT)).toEqual({
      credentialId: 'oauth-consent:consent-1',
      dashboards: MEMBERSHIPS,
    });
  });
});

describe('resolveTokenMcpContext', () => {
  const TOKEN = { id: 'token-1', createdBy: 'user-1', expiresAt: null, dashboardIds: ['dash-a', 'dash-left'] };

  it("reads the picked dashboards the creator is still a member of, with the creator's current role", async () => {
    expect(await resolveTokenMcpContext(TOKEN)).toEqual({
      credentialId: 'mcp-token:token-1',
      dashboards: [{ dashboardId: 'dash-a', siteId: 'site-a', domain: 'a.example.com', role: 'viewer' }],
    });
    expect(mocks.findUserMemberships).toHaveBeenCalledWith('user-1');
    expect(mocks.updateMcpTokenLastUsed).toHaveBeenCalledWith('token-1');
  });

  it("follows the creator's role on the next call", async () => {
    mocks.findUserMemberships.mockResolvedValueOnce([{ ...MEMBERSHIPS[1]!, role: 'admin' }]);
    expect((await resolveTokenMcpContext(TOKEN)).dashboards[0]?.role).toBe('admin');

    expect((await resolveTokenMcpContext(TOKEN)).dashboards[0]?.role).toBe('viewer');
  });

  it('never reads a dashboard that was not picked, even one the creator owns', async () => {
    const context = await resolveTokenMcpContext(TOKEN);
    expect(context.dashboards.map((d) => d.dashboardId)).not.toContain('dash-new');
  });

  it('reads nothing once the creator has left every picked dashboard', async () => {
    mocks.findUserMemberships.mockResolvedValue([MEMBERSHIPS[0]]);
    expect((await resolveTokenMcpContext(TOKEN)).dashboards).toEqual([]);
  });
});

describe('assertPickedDashboardsAvailable', () => {
  it('accepts All dashboards and dashboards the user is a member of', async () => {
    await expect(
      assertPickedDashboardsAvailable('user-1', { allDashboards: true, dashboardIds: [] }),
    ).resolves.toBeUndefined();
    await expect(
      assertPickedDashboardsAvailable('user-1', { allDashboards: false, dashboardIds: ['dash-a'] }),
    ).resolves.toBeUndefined();
  });

  it('refuses a dashboard the user is not a member of', async () => {
    await expect(
      assertPickedDashboardsAvailable('user-1', { allDashboards: false, dashboardIds: ['dash-a', 'dash-other'] }),
    ).rejects.toThrow('dashboardUnavailable');
  });
});
