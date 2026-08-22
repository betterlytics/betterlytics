'server-only';

import { createHash } from 'crypto';
import { env } from '@/lib/env';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { findCredentialAccount } from '@/repositories/postgres/user.repository';
import {
  RESET_TOKEN_PREFIX,
  deleteUserResetTokens,
  findResetTokenUserId,
} from '@/repositories/postgres/resetToken.repository';

export const RESET_TOKEN_EXPIRY_SECONDS = 3600;

const EXPIRY_HOURS = RESET_TOKEN_EXPIRY_SECONDS / 3600;
const EXPIRATION_TIME_TEXT = `${EXPIRY_HOURS} hour${EXPIRY_HOURS > 1 ? 's' : ''}`;

export function resetTokenStoredIdentifier(token: string): string {
  return RESET_TOKEN_PREFIX + createHash('sha256').update(token).digest('hex');
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  return (await findResetTokenUserId(resetTokenStoredIdentifier(token))) !== null;
}

export async function sendResetPasswordEmail(
  user: { id: string; email: string; name: string | null },
  url: string,
  token: string,
): Promise<void> {
  // OAuth-only accounts must not receive reset links; redeeming one would attach a password login
  if (!(await findCredentialAccount(user.id))) {
    await deleteUserResetTokens(user.id);
    return;
  }

  await deleteUserResetTokens(user.id, resetTokenStoredIdentifier(token));

  await enqueueEmail({
    type: 'reset-password',
    recipientKey: createUserRecipientKey(user.id),
    campaignKey: resetTokenStoredIdentifier(token),
    data: {
      to: user.email,
      userName: user.name,
      resetUrl: url,
      expirationTime: EXPIRATION_TIME_TEXT,
    },
  });
}

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
