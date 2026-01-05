'use server';

import { RegisterUserData, RegisterUserSchema } from '@/entities/auth/user.entities';
import { registerNewUser } from '@/services/auth/auth.service';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { withServerAction } from '@/middlewares/serverActionHandler';
import { UserException } from '@/lib/exceptions';
import { withUserAuth } from '@/auth/auth-actions';
import { isUserDashboardMember } from '@/services/dashboard/members.service';
import { isUserInvited } from '@/services/dashboard/invitation.service';

export const registerUserAction = withServerAction(async (registrationData: RegisterUserData) => {
  if (!isFeatureEnabled('enableRegistration')) {
    throw new UserException('Registration is disabled');
  }

  const validatedData = RegisterUserSchema.parse(registrationData);
  const newUser = await registerNewUser(validatedData);

  if (isFeatureEnabled('enableAccountVerification')) {
    try {
      await sendVerificationEmail({
        email: newUser.email,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
  }

  return newUser;
});

export const isUserInvitedDashboardMemberAction = withUserAuth(async (user): Promise<boolean> => {
  const isMember = await isUserDashboardMember(user.id);
  const isInvited = await isUserInvited(user.email);

  return isMember || isInvited;
});
