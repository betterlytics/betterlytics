'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { checkTrackingDataExists } from '@/services/dashboard/verification';
import { checkRateLimit } from '@/services/account/verification.service';
import {
  SendVerificationEmailData,
  SendVerificationEmailSchema,
  VerifyEmailData,
  VerifyEmailSchema,
  VerificationResult,
} from '@/entities/verification';
import { sendVerificationEmail, verifyEmail } from '@/services/account/verification.service';

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

export async function resendVerificationEmailAction(formData: SendVerificationEmailData) {
  try {
    const validatedData = SendVerificationEmailSchema.parse(formData);
    const { email } = validatedData;

    const rateLimitCheck = await checkRateLimit(email);

    if (!rateLimitCheck.allowed && rateLimitCheck.nextAllowedAt) {
      const waitTime = Math.ceil((rateLimitCheck.nextAllowedAt.getTime() - Date.now()) / 60000);
      return {
        success: false,
        error: `Please wait ${waitTime} minutes before requesting another verification email.`,
      };
    }

    await sendVerificationEmail({ email });
    return { success: true };
  } catch (error) {
    console.error('Resend verification email action error:', error);
    return {
      success: false,
      error: 'Failed to resend verification email',
    };
  }
}
