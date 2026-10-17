import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  acceptInvitation,
  acceptPendingInvitations,
  declineInvitation,
  getPendingInvitations,
  getPendingInvitationsForUser,
  isUserInvited,
} from '@/services/dashboard/invitation.service';
import {
  findInvitationByToken,
  findPendingInvitationsByDashboard,
  findPendingInvitationsByEmail,
  updateInvitationStatus,
} from '@/repositories/postgres/invitation.repository';
import { addDashboardMember, findUserDashboardOrNull } from '@/repositories/postgres/dashboard.repository';
import type { InvitationWithInviter } from '@/entities/dashboard/invitation.entities';

vi.mock('@/repositories/postgres/invitation.repository', () => ({
  createInvitation: vi.fn(),
  findPendingInvitationsByDashboard: vi.fn(),
  findInvitationByToken: vi.fn(),
  findInvitationByEmail: vi.fn(),
  updateInvitationStatus: vi.fn(),
  findPendingInvitationsByEmail: vi.fn(),
  deleteInvitation: vi.fn(),
}));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findUserDashboardOrNull: vi.fn(),
  addDashboardMember: vi.fn(),
  findDashboardMembers: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  findUserByEmail: vi.fn(),
}));
vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(),
}));
vi.mock('@/services/email/recipient-key.service', () => ({
  createEmailRecipientKey: vi.fn(),
  createUserRecipientKey: vi.fn(),
}));
vi.mock('@/lib/env/shared.env', () => ({
  sharedEmailEnv: { publicBaseUrl: 'https://app.example.com' },
}));
vi.mock('@/lib/billing/capabilityAccess', () => ({
  getDashboardCapabilities: vi.fn(),
}));
vi.mock('next-intl/server', () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));

const future = new Date(Date.now() + 60_000);
const invitation = (overrides: Partial<InvitationWithInviter> = {}): InvitationWithInviter => ({
  id: 'inv-1',
  dashboardId: 'dash-1',
  email: 'invited@example.com',
  role: 'viewer',
  invitedById: 'inviter-1',
  token: 'token-1',
  expiresAt: future,
  status: 'pending',
  createdAt: new Date(),
  invitedBy: { id: 'inviter-1', name: 'Inviter', email: 'inviter@example.com' },
  dashboard: { id: 'dash-1', domain: 'example.com' },
  ...overrides,
});

const verified = { id: 'user-1', email: 'invited@example.com', emailVerified: true };
const unverified = { id: 'user-1', email: 'invited@example.com', emailVerified: false };
const unknownVerification = { id: 'user-1', email: 'invited@example.com', emailVerified: undefined };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(findPendingInvitationsByEmail).mockResolvedValue([invitation()]);
  vi.mocked(findUserDashboardOrNull).mockResolvedValue(null);
});

describe('getPendingInvitations', () => {
  beforeEach(() => {
    vi.mocked(findPendingInvitationsByDashboard).mockResolvedValue([invitation({ role: 'admin' })]);
  });

  it.each(['owner', 'admin'] as const)('gives a %s the invite tokens', async (role) => {
    const [pending] = await getPendingInvitations('dash-1', role);
    expect(pending.token).toBe('token-1');
  });

  it.each(['editor', 'viewer'] as const)('withholds the invite tokens from a %s', async (role) => {
    const [pending] = await getPendingInvitations('dash-1', role);
    expect(pending.token).toBeNull();
    expect(pending.email).toBe('invited@example.com');
  });
});

describe('acceptPendingInvitations', () => {
  it.each([unverified, unknownVerification])('accepts nothing for an unverified address', async (user) => {
    expect(await acceptPendingInvitations(user)).toEqual([]);
    expect(findPendingInvitationsByEmail).not.toHaveBeenCalled();
    expect(addDashboardMember).not.toHaveBeenCalled();
  });

  it('adds a member per invitation and marks each one accepted for a verified address', async () => {
    vi.mocked(findPendingInvitationsByEmail).mockResolvedValue([
      invitation(),
      invitation({ id: 'inv-2', dashboardId: 'dash-2', role: 'editor' }),
    ]);

    const accepted = await acceptPendingInvitations(verified);

    expect(accepted).toHaveLength(2);
    expect(addDashboardMember).toHaveBeenCalledWith('dash-1', 'user-1', 'viewer');
    expect(addDashboardMember).toHaveBeenCalledWith('dash-2', 'user-1', 'editor');
    expect(updateInvitationStatus).toHaveBeenCalledWith('inv-1', 'accepted');
    expect(updateInvitationStatus).toHaveBeenCalledWith('inv-2', 'accepted');
  });
});

describe('address-matched lookups', () => {
  it('hides pending invitations from an unverified address', async () => {
    expect(await getPendingInvitationsForUser(unverified)).toEqual([]);
    expect(await isUserInvited(unverified)).toBe(false);
    expect(findPendingInvitationsByEmail).not.toHaveBeenCalled();
  });

  it('lists pending invitations for a verified address', async () => {
    expect(await getPendingInvitationsForUser(verified)).toHaveLength(1);
    expect(await isUserInvited(verified)).toBe(true);
  });

  it('refuses to decline on behalf of an unverified address', async () => {
    await expect(declineInvitation('inv-1', unverified)).rejects.toThrow('invitationNotFound');
    expect(updateInvitationStatus).not.toHaveBeenCalled();
  });

  it.each(['invited', 'first_user'])(
    'trusts an unverified address on an account created as %s',
    async (method) => {
      const user = { ...unverified, signupMethod: method };

      expect(await getPendingInvitationsForUser(user)).toHaveLength(1);
      expect(await isUserInvited(user)).toBe(true);
      expect(await acceptPendingInvitations(user)).toHaveLength(1);
      expect(addDashboardMember).toHaveBeenCalledWith('dash-1', 'user-1', 'viewer');
    },
  );

  it.each(['registration_enabled', null])(
    'does not trust an unverified address on an account created as %s',
    async (method) => {
      const user = { ...unverified, signupMethod: method };

      expect(await getPendingInvitationsForUser(user)).toEqual([]);
      expect(await acceptPendingInvitations(user)).toEqual([]);
      expect(findPendingInvitationsByEmail).not.toHaveBeenCalled();
    },
  );
});

describe('acceptInvitation', () => {
  it('accepts by token for a matching address without any verification check', async () => {
    vi.mocked(findInvitationByToken).mockResolvedValue(invitation());

    expect(await acceptInvitation('token-1', 'user-1', 'invited@example.com')).toBe('dash-1');
    expect(addDashboardMember).toHaveBeenCalledWith('dash-1', 'user-1', 'viewer');
    expect(updateInvitationStatus).toHaveBeenCalledWith('inv-1', 'accepted');
  });
});
