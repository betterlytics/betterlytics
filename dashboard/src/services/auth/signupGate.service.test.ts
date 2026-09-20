import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSignupAllowance, isFirstUser } from '@/services/auth/signupGate.service';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { countUsers } from '@/repositories/postgres/user.repository';
import {
  findInvitationByToken,
  findPendingInvitationsByEmail,
} from '@/repositories/postgres/invitation.repository';

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({
  countUsers: vi.fn(),
}));
vi.mock('@/repositories/postgres/invitation.repository', () => ({
  findInvitationByToken: vi.fn(),
  findPendingInvitationsByEmail: vi.fn(),
}));

type Invitation = NonNullable<Awaited<ReturnType<typeof findInvitationByToken>>>;
const future = new Date(Date.now() + 60_000);
const past = new Date(Date.now() - 60_000);
const openInvitation = (overrides: Partial<Invitation> = {}) =>
  ({
    id: 'inv-1',
    email: 'invited@example.com',
    status: 'pending',
    expiresAt: future,
    ...overrides,
  }) as Invitation;

describe('getSignupAllowance', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isFeatureEnabled).mockReturnValue(false);
    vi.mocked(countUsers).mockResolvedValue(5);
    vi.mocked(findInvitationByToken).mockResolvedValue(null);
    vi.mocked(findPendingInvitationsByEmail).mockResolvedValue([]);
  });

  it('allows everyone when registration is enabled, without looking up invitations', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);

    await expect(getSignupAllowance({ email: 'anyone@example.com' })).resolves.toBe('registration_enabled');
    expect(findInvitationByToken).not.toHaveBeenCalled();
  });

  it('allows the first account on an empty instance even with registration disabled', async () => {
    vi.mocked(countUsers).mockResolvedValue(0);

    await expect(getSignupAllowance({ email: 'first@example.com' })).resolves.toBe('first_user');
    await expect(getSignupAllowance()).resolves.toBe('first_user');
  });

  it('reports the first account as first_user even when registration is open, so it becomes the admin', async () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    vi.mocked(countUsers).mockResolvedValue(0);

    await expect(getSignupAllowance({ email: 'first@example.com' })).resolves.toBe('first_user');
  });

  it('rejects an uninvited address once the instance has users', async () => {
    await expect(getSignupAllowance({ email: 'stranger@example.com' })).resolves.toBeNull();
    await expect(getSignupAllowance()).resolves.toBeNull();
  });

  describe('invite token', () => {
    it('allows the invited address when it presents its own open invitation', async () => {
      vi.mocked(findInvitationByToken).mockResolvedValue(openInvitation());

      await expect(getSignupAllowance({ email: 'Invited@Example.com', inviteToken: 'tok' })).resolves.toBe(
        'invited',
      );
      expect(findInvitationByToken).toHaveBeenCalledWith('tok');
    });

    it('refuses a token that was issued to a different address', async () => {
      vi.mocked(findInvitationByToken).mockResolvedValue(openInvitation({ email: 'someone-else@example.com' }));

      await expect(getSignupAllowance({ email: 'invited@example.com', inviteToken: 'tok' })).resolves.toBeNull();
    });

    it.each([
      ['expired', openInvitation({ expiresAt: past })],
      ['already accepted', openInvitation({ status: 'accepted' })],
      ['cancelled', openInvitation({ status: 'cancelled' })],
      ['unknown', null],
    ])('refuses a token whose invitation is %s', async (_label, invitation) => {
      vi.mocked(findInvitationByToken).mockResolvedValue(invitation);

      await expect(getSignupAllowance({ email: 'invited@example.com', inviteToken: 'tok' })).resolves.toBeNull();
    });
  });

  describe('address-only matching', () => {
    it('is never enough for an unverified email, even when the address is invited', async () => {
      vi.mocked(findPendingInvitationsByEmail).mockResolvedValue([openInvitation()]);

      await expect(getSignupAllowance({ email: 'invited@example.com' })).resolves.toBeNull();
      await expect(getSignupAllowance({ email: 'invited@example.com', emailVerified: false })).resolves.toBeNull();
      expect(findPendingInvitationsByEmail).not.toHaveBeenCalled();
    });

    it('is enough for a provider-verified email (OAuth sign-ups carry no token)', async () => {
      vi.mocked(findPendingInvitationsByEmail).mockResolvedValue([openInvitation()]);

      await expect(getSignupAllowance({ email: 'Invited@Example.com', emailVerified: true })).resolves.toBe(
        'invited',
      );
      expect(findPendingInvitationsByEmail).toHaveBeenCalledWith('invited@example.com');
    });

    it('still refuses a verified email with no pending invitation', async () => {
      await expect(getSignupAllowance({ email: 'verified@example.com', emailVerified: true })).resolves.toBeNull();
    });
  });
});

describe('isFirstUser', () => {
  it('is true only for an empty user table', async () => {
    vi.mocked(countUsers).mockResolvedValue(0);
    await expect(isFirstUser()).resolves.toBe(true);
    vi.mocked(countUsers).mockResolvedValue(1);
    await expect(isFirstUser()).resolves.toBe(false);
  });
});
