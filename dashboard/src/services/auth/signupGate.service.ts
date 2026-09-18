import 'server-only';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { countUsers } from '@/repositories/postgres/user.repository';
import {
  findInvitationByToken,
  findPendingInvitationsByEmail,
} from '@/repositories/postgres/invitation.repository';
import { isOpenInvitation } from '@/entities/dashboard/invitation.entities';

/**
 * Why a sign-up may proceed. ENABLE_REGISTRATION only governs unsolicited sign-ups:
 * an invited address and the very first account on an empty instance are always allowed.
 */
export type SignupAllowance = 'registration_enabled' | 'invited' | 'first_user';

export type SignupCandidate = {
  email?: string;
  /** Invitation token presented with the sign-up (the link the invitee clicked) */
  inviteToken?: string;
  /** True when an identity provider vouched for the address, so it cannot be claimed by a stranger */
  emailVerified?: boolean;
};

export async function isFirstUser(): Promise<boolean> {
  return (await countUsers()) === 0;
}

/**
 * The invite exemption is bound to possession of the token, not knowledge of the address:
 * a closed instance must not let anyone who merely knows an invited email register it.
 * Provider-verified emails (OAuth) have no token to carry but cannot be spoofed, so they
 * may match on address alone.
 */
async function isInvited({ email, inviteToken, emailVerified }: SignupCandidate): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase();

  if (inviteToken) {
    const invitation = await findInvitationByToken(inviteToken);
    if (invitation && isOpenInvitation(invitation) && invitation.email.toLowerCase() === normalized) {
      return true;
    }
  }

  if (emailVerified) {
    return (await findPendingInvitationsByEmail(normalized)).length > 0;
  }

  return false;
}

export async function getSignupAllowance(candidate: SignupCandidate = {}): Promise<SignupAllowance | null> {
  if (isFeatureEnabled('enableRegistration')) return 'registration_enabled';
  if (await isFirstUser()) return 'first_user';
  if (await isInvited(candidate)) return 'invited';
  return null;
}
