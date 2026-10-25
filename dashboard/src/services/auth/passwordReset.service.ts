'server-only';

import { createHash, randomBytes } from 'crypto';
import { env } from '@/lib/env';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import {
  RESET_TOKEN_PREFIX,
  deleteUserResetTokens,
  findResetTokenUserId,
  replaceUserResetToken,
} from '@/repositories/postgres/resetToken.repository';
import { findUserById } from '@/repositories/postgres/user.repository';

export const RESET_TOKEN_EXPIRY_SECONDS = 3600;

// Admin-issued links travel out of band (chat, in person), so they outlive the self-service one
export const ADMIN_RESET_TOKEN_EXPIRY_SECONDS = 24 * 3600;

function expirationTimeText(expirySeconds: number): string {
  const hours = expirySeconds / 3600;
  return `${hours} hour${hours > 1 ? 's' : ''}`;
}

export function resetTokenStoredIdentifier(token: string): string {
  return RESET_TOKEN_PREFIX + createHash('sha256').update(token).digest('hex');
}

/** The email of the account a live reset token belongs to, or null when the token is unknown or expired. */
export async function findResetTokenEmail(token: string): Promise<string | null> {
  const userId = await findResetTokenUserId(resetTokenStoredIdentifier(token));
  if (!userId) return null;
  return (await findUserById(userId))?.email ?? null;
}

export async function sendResetPasswordEmail(
  user: { id: string; email: string; name: string | null },
  url: string,
  token: string,
  expirySeconds: number = RESET_TOKEN_EXPIRY_SECONDS,
): Promise<void> {
  await deleteUserResetTokens(user.id, resetTokenStoredIdentifier(token));

  await enqueueEmail({
    type: 'reset-password',
    recipientKey: createUserRecipientKey(user.id),
    campaignKey: resetTokenStoredIdentifier(token),
    data: {
      to: user.email,
      userName: user.name,
      resetUrl: url,
      expirationTime: expirationTimeText(expirySeconds),
    },
  });
}

/**
 * Issues a reset link the same way better-auth does (hashed `reset-password:` Verification row,
 * value = userId), replacing any earlier link, so the regular /reset-password page redeems it.
 */
export async function issueAdminPasswordResetLink(
  userId: string,
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + ADMIN_RESET_TOKEN_EXPIRY_SECONDS * 1000);
  await replaceUserResetToken(userId, resetTokenStoredIdentifier(token), expiresAt);
  const url = `${env.PUBLIC_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return { token, url, expiresAt };
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
