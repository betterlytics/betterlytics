'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { isUserDashboardMember } from '@/services/dashboard/members.service';
import { isUserInvited } from '@/services/dashboard/invitation.service';

export const isUserInvitedDashboardMemberAction = withUserAuth(async (user): Promise<boolean> => {
  const [isMember, isInvited] = await Promise.all([isUserDashboardMember(user.id), isUserInvited(user.email)]);

  return isMember || isInvited;
});
