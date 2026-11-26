import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUserById: vi.fn(),
  findMcpConsentGrant: vi.fn(),
  findUserMemberships: vi.fn(),
}));

vi.mock('@/repositories/postgres/user.repository', () => ({ findUserById: mocks.findUserById }));
vi.mock('@/repositories/postgres/mcpGrant.repository', () => ({ findMcpConsentGrant: mocks.findMcpConsentGrant }));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserMemberships: mocks.findUserMemberships,
}));

import { grantedDashboards, resolveOAuthMcpContext } from '@/services/auth/mcpAccess.service';

const MEMBERSHIPS = [
  { dashboardId: 'dash-new', siteId: 'site-new', domain: 'new.example.com', role: 'owner' as const },
  { dashboardId: 'dash-a', siteId: 'site-a', domain: 'a.example.com', role: 'viewer' as const },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUserById.mockResolvedValue({ id: 'user-1', deletedAt: null, disabledAt: null });
  mocks.findUserMemberships.mockResolvedValue(MEMBERSHIPS);
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
  });
});
