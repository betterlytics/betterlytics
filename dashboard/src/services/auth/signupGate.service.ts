import 'server-only';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { countUsers } from '@/repositories/postgres/user.repository';
import {
  findInvitationByToken,
  findPendingInvitationsByEmail,
} from '@/repositories/postgres/invitation.repository';
import { isOpenInvitation } from '@/entities/dashboard/invitation.entities';

// ENABLE_REGISTRATION only governs unsolicited sign-ups
export type SignupAllowance = 'registration_enabled' | 'invited' | 'first_user';

export type SignupCandidate = {
  email?: string;
  inviteToken?: string;
  emailVerified?: boolean;
};

export async function isFirstUser(): Promise<boolean> {
  return (await countUsers()) === 0;
}

// Bound to the token, not the address; provider-verified (OAuth) emails may match on address alone
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
  if (await isFirstUser()) return 'first_user';
  if (isFeatureEnabled('enableRegistration')) return 'registration_enabled';
  if (await isInvited(candidate)) return 'invited';
  return null;
}
