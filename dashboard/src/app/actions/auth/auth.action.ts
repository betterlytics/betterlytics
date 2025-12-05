'use server';

import { RegisterUserData, RegisterUserSchema } from '@/entities/auth/user';
import { registerNewUser } from '@/services/auth/auth.service';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { sendVerificationEmail } from '@/services/account/verification.service';
import { withServerAction } from '@/middlewares/serverActionHandler';
import { UserException } from '@/lib/exceptions';

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
