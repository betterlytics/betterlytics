import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUserById: vi.fn(),
  findMcpConsentGrant: vi.fn(),
  touchMcpGrantLastUsed: vi.fn(),
  findUserMemberships: vi.fn(),
}));

vi.mock('@/repositories/postgres/user.repository', () => ({ findUserById: mocks.findUserById }));
vi.mock('@/repositories/postgres/mcpGrant.repository', () => ({
  findMcpConsentGrant: mocks.findMcpConsentGrant,
  touchMcpGrantLastUsed: mocks.touchMcpGrantLastUsed,
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserMemberships: mocks.findUserMemberships,
}));

import {
  assertPickedDashboardsAvailable,
  grantedDashboards,
  resolveOAuthMcpContext,
} from '@/services/auth/mcpAccess.service';

const MEMBERSHIPS = [
  { dashboardId: 'dash-new', siteId: 'site-new', domain: 'new.example.com', role: 'owner' as const },
  { dashboardId: 'dash-a', siteId: 'site-a', domain: 'a.example.com', role: 'viewer' as const },
];

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

    expect(await resolveOAuthMcpContext('user-1', 'client-1')).toEqual({
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

    expect(await resolveOAuthMcpContext('user-1', 'client-1')).toEqual({
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

    expect(await resolveOAuthMcpContext('user-1', 'client-1')).toBeNull();
    expect(mocks.touchMcpGrantLastUsed).not.toHaveBeenCalled();
  });

  it('records the use on the consent it authorized', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({ consentId: 'consent-1', grant: null });

    await resolveOAuthMcpContext('user-1', 'client-1');

    expect(mocks.touchMcpGrantLastUsed).toHaveBeenCalledWith('consent-1');
  });

  it('still authorizes the call when recording the use fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: true, dashboardIds: [] },
    });
    mocks.touchMcpGrantLastUsed.mockRejectedValue(new Error('database down'));

    expect(await resolveOAuthMcpContext('user-1', 'client-1')).toEqual({
      credentialId: 'oauth-consent:consent-1',
      dashboards: MEMBERSHIPS,
    });
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
    ).rejects.toThrow('no longer available');
  });
});
