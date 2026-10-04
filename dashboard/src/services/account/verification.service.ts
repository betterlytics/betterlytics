'server-only';

import { APIError } from 'better-auth/api';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const VERIFICATION_LINK_EXPIRY_SECONDS = 24 * 60 * 60;

export async function sendVerificationEmail(
  user: { id: string; email: string; name: string | null },
  url: string,
): Promise<void> {
  if (!isFeatureEnabled('enableAccountVerification')) return;
  const result = await enqueueEmail({
    type: 'email-verification',
    recipientKey: createUserRecipientKey(user.id),
    campaignKey: 'email-verification',
    data: { to: user.email, userName: user.name, verificationUrl: url },
  });
  if (result === 'throttled') {
    throw new APIError('TOO_MANY_REQUESTS', {
      message: 'A verification email was sent recently. Please wait a few minutes before trying again.',
    });
  }
}
