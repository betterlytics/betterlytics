'use server';

import { RegisterUserData, RegisterUserSchema } from '@/entities/user';
import { registerNewUser } from '@/services/auth.service';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { sendWelcomeEmail } from '@/services/email/mail.service';

export async function registerUserAction(registrationData: RegisterUserData) {
  if (!isFeatureEnabled('enableRegistration')) {
    throw new Error('Registration is disabled');
  }

  try {
    const validatedData = RegisterUserSchema.parse(registrationData);
    const newUser = await registerNewUser(validatedData);

    try {
      await sendWelcomeEmail({
        to: newUser.email!,
        userName: newUser.name || newUser.email!.split('@')[0],
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return newUser;
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        throw new Error('A user with this email already exists');
      }
    }

    throw new Error('Registration failed. Please try again.');
  }
}
