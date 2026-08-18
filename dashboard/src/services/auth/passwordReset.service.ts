'server-only';

import { env } from '@/lib/env';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';

export async function sendPasswordChangedNotification(
  userId: string,
  email: string,
  name: string | null,
): Promise<void> {
  try {
    await enqueueEmail({
      type: 'password-changed',
      recipientKey: createUserRecipientKey(userId),
      campaignKey: `password-changed:${new Date().toISOString()}`,
      data: {
        to: email,
        userName: name,
        resetPasswordUrl: `${env.PUBLIC_BASE_URL}/forgot-password`,
      },
    });
  } catch (err) {
    console.error('Failed to enqueue password-changed notification:', { userId, err });
  }
}
