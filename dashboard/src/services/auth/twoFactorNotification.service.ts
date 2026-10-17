'server-only';

import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';

export async function sendTwoFactorChangedNotification(
  user: { id: string; email: string; name: string | null },
  enabled: boolean,
): Promise<void> {
  const type = enabled ? ('two-factor-enabled' as const) : ('two-factor-disabled' as const);
  try {
    await enqueueEmail({
      type,
      recipientKey: createUserRecipientKey(user.id),
      campaignKey: `${type}:${new Date().toISOString()}`,
      data: { to: user.email, userName: user.name },
    });
  } catch (error) {
    console.error('Failed to enqueue 2FA change notification:', error);
  }
}
