'use server';

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

/**
 * The target address always comes from the session, never from the client. A client-chosen
 * address would turn the per-address responses into an account-enumeration oracle.
 */
export const resendVerificationEmailAction = withUserAuth(async (user: User): Promise<void> => {
  const rateLimitCheck = await checkRateLimit(user.email);

  if (!rateLimitCheck.allowed && rateLimitCheck.nextAllowedAt) {
    const waitTime = Math.max(1, Math.ceil((rateLimitCheck.nextAllowedAt.getTime() - Date.now()) / 60000));
    throw new UserException(`Please wait ${waitTime} minutes before requesting another verification email.`);
  }

  await sendVerificationEmail({ email: user.email });
});
