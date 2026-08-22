'use server';

import { getTranslations } from 'next-intl/server';
import { withDashboardAuthContext, withUserAuth } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import type { User } from '@/entities/auth/session.entities';
import { UserException } from '@/lib/exceptions';
import { checkTrackingDataExists } from '@/services/dashboard/verification.service';
import { VerifyEmailData, VerifyEmailSchema, VerificationResult } from '@/entities/account/verification.entities';
import { checkRateLimit, sendVerificationEmail, verifyEmail } from '@/services/account/verification.service';

export const verifyTrackingInstallation = withDashboardAuthContext(async (ctx: AuthContext): Promise<boolean> => {
  const { siteId } = ctx;

  try {
    return await checkTrackingDataExists(siteId);
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
});

export async function verifyEmailAction(data: VerifyEmailData): Promise<VerificationResult> {
  try {
    const validatedData = VerifyEmailSchema.parse(data);
    return await verifyEmail(validatedData);
  } catch (error) {
    console.error('Verify email action error:', error);
    return {
      success: false,
      error: 'Failed to verify email, please request a new verification email and try again.',
    };
  }
}

export const resendVerificationEmailAction = withUserAuth(async (user: User): Promise<void> => {
  if (user.emailVerified) {
    throw new UserException((await getTranslations('validation'))('emailAlreadyVerified'));
  }

  const rateLimitCheck = await checkRateLimit(user.email);

  if (!rateLimitCheck.allowed && rateLimitCheck.nextAllowedAt) {
    const waitTime = Math.max(1, Math.ceil((rateLimitCheck.nextAllowedAt.getTime() - Date.now()) / 60000));
    throw new UserException((await getTranslations('validation'))('verificationEmailCooldown', { minutes: waitTime }));
  }

  await sendVerificationEmail({ email: user.email });
});
