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
  selectionKeepingExclusions,
  resolveOAuthMcpContext,
  resolveTokenMcpContext,
} from '@/services/auth/mcpAccess.service';

const MEMBERSHIPS = [
  {
    dashboardId: 'dash-new',
    siteId: 'site-new',
    domain: 'new.example.com',
    role: 'owner' as const,
    aiAccessEnabled: true,
  },
  {
    dashboardId: 'dash-a',
    siteId: 'site-a',
    domain: 'a.example.com',
    role: 'viewer' as const,
    aiAccessEnabled: true,
  },
];
// the dashboard as a call reads it
const NEW = { dashboardId: 'dash-new', siteId: 'site-new', domain: 'new.example.com', role: 'owner' };
const A = { dashboardId: 'dash-a', siteId: 'site-a', domain: 'a.example.com', role: 'viewer' };
const withAiAccessOff = (dashboardId: string) =>
  MEMBERSHIPS.map((m) => (m.dashboardId === dashboardId ? { ...m, aiAccessEnabled: false } : m));

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
    ).toEqual([MEMBERSHIPS[1]]);
  });

  it('reads nothing for a consent without a grant', () => {
    expect(grantedDashboards(null, MEMBERSHIPS)).toEqual([]);
  });

  it('leaves out a dashboard removed from All dashboards and keeps the others, joined later or not', () => {
    expect(
      grantedDashboards(
        { allDashboards: true, dashboardIds: [], excludedDashboardIds: ['dash-a'] },
        MEMBERSHIPS,
      ).map((d) => d.dashboardId),
    ).toEqual(['dash-new']);
  });

  it('keeps a granted dashboard whose AI access is off, so turning it back on restores it', () => {
    expect(
      grantedDashboards({ allDashboards: false, dashboardIds: ['dash-a'] }, withAiAccessOff('dash-a')),
    ).toEqual([{ ...MEMBERSHIPS[1], aiAccessEnabled: false }]);
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
      dashboards: [A],
      aiAccessDisabledDashboardIds: [],
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
      aiAccessDisabledDashboardIds: [],
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
      dashboards: [NEW, A],
      aiAccessDisabledDashboardIds: [],
    });
  });

  it('stays valid and names the dashboard whose AI access is off instead of reading it', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: true, dashboardIds: [], excludedDashboardIds: [] },
    });
    mocks.findUserMemberships.mockResolvedValue(withAiAccessOff('dash-a'));

    expect(await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT)).toEqual({
      credentialId: 'oauth-consent:consent-1',
      dashboards: [NEW],
      aiAccessDisabledDashboardIds: ['dash-a'],
    });
  });

  it('reads the dashboard again on the next call once AI access is back on', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: false, dashboardIds: ['dash-a'], excludedDashboardIds: [] },
    });
    mocks.findUserMemberships.mockResolvedValueOnce(withAiAccessOff('dash-a'));

    expect((await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT))?.dashboards).toEqual([]);
    expect((await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT))?.dashboards).toEqual([A]);
  });

  it('reads no dashboard an owner removed from an All dashboards connection, and keeps the others', async () => {
    mocks.findMcpConsentGrant.mockResolvedValue({
      consentId: 'consent-1',
      grant: { allDashboards: true, dashboardIds: [], excludedDashboardIds: ['dash-a'] },
    });

    expect(await resolveOAuthMcpContext('user-1', 'client-1', ISSUED_AT)).toEqual({
      credentialId: 'oauth-consent:consent-1',
      dashboards: [NEW],
      aiAccessDisabledDashboardIds: [],
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
      dashboards: [NEW, A],
      aiAccessDisabledDashboardIds: [],
    });
  });
});

describe('resolveTokenMcpContext', () => {
  const TOKEN = { id: 'token-1', createdBy: 'user-1', expiresAt: null, dashboardIds: ['dash-a', 'dash-left'] };

  it("reads the picked dashboards the creator is still a member of, with the creator's current role", async () => {
    expect(await resolveTokenMcpContext(TOKEN)).toEqual({
      credentialId: 'mcp-token:token-1',
      dashboards: [A],
      aiAccessDisabledDashboardIds: [],
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

  it('names a picked dashboard whose AI access is off instead of reading it, until it is back on', async () => {
    mocks.findUserMemberships.mockResolvedValueOnce(withAiAccessOff('dash-a'));
    expect(await resolveTokenMcpContext(TOKEN)).toEqual({
      credentialId: 'mcp-token:token-1',
      dashboards: [],
      aiAccessDisabledDashboardIds: ['dash-a'],
    });

    expect((await resolveTokenMcpContext(TOKEN)).dashboards).toEqual([A]);
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

  it('refuses a new pick of a dashboard whose AI access is off', async () => {
    mocks.findUserMemberships.mockResolvedValue(withAiAccessOff('dash-a'));
    await expect(
      assertPickedDashboardsAvailable('user-1', { allDashboards: false, dashboardIds: ['dash-a'] }),
    ).rejects.toThrow('aiAccessDisabled');
    await expect(
      assertPickedDashboardsAvailable(
        'user-1',
        { allDashboards: false, dashboardIds: ['dash-new', 'dash-a'] },
        { allDashboards: false, dashboardIds: ['dash-new'] },
      ),
    ).rejects.toThrow('aiAccessDisabled');
  });

  it('keeps a dashboard with AI access off that the credential already grants', async () => {
    mocks.findUserMemberships.mockResolvedValue(withAiAccessOff('dash-a'));
    await expect(
      assertPickedDashboardsAvailable(
        'user-1',
        { allDashboards: false, dashboardIds: ['dash-new', 'dash-a'] },
        { allDashboards: false, dashboardIds: ['dash-a'] },
      ),
    ).resolves.toBeUndefined();
    await expect(
      assertPickedDashboardsAvailable(
        'user-1',
        { allDashboards: false, dashboardIds: ['dash-a'] },
        { allDashboards: true, dashboardIds: [], excludedDashboardIds: [] },
      ),
    ).resolves.toBeUndefined();
  });
});

describe('selectionKeepingExclusions', () => {
  const removedA = { allDashboards: true, dashboardIds: [], excludedDashboardIds: ['dash-a'] };

  it('keeps a removed dashboard the member left out, and drops one they ticked again', () => {
    expect(
      selectionKeepingExclusions(
        { allDashboards: true, dashboardIds: [], excludedDashboardIds: ['dash-a'] },
        removedA,
      ),
    ).toEqual(removedA);
    expect(
      selectionKeepingExclusions({ allDashboards: true, dashboardIds: [], excludedDashboardIds: [] }, removedA)
        .excludedDashboardIds,
    ).toEqual([]);
  });

  it('removes nothing that owners or admins did not, nor on a first consent', () => {
    expect(
      selectionKeepingExclusions(
        { allDashboards: true, dashboardIds: [], excludedDashboardIds: ['dash-a', 'dash-new'] },
        removedA,
      ).excludedDashboardIds,
    ).toEqual(['dash-a']);
    expect(
      selectionKeepingExclusions({ allDashboards: true, dashboardIds: [], excludedDashboardIds: ['dash-a'] }, null)
        .excludedDashboardIds,
    ).toEqual([]);
  });

  it('has no excluded dashboards for picked dashboards', () => {
    expect(
      selectionKeepingExclusions(
        { allDashboards: false, dashboardIds: ['dash-new'], excludedDashboardIds: ['dash-a'] },
        removedA,
      ),
    ).toEqual({ allDashboards: false, dashboardIds: ['dash-new'], excludedDashboardIds: [] });
  });
});
