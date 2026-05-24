'server-only';

import { ForgotPasswordData, ResetPasswordData } from '@/entities/auth/passwordReset.entities';
import { findUserByEmail, findUserById, updateUserPassword } from '@/repositories/postgres/user.repository';
import {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  deleteUserPasswordResetTokens,
} from '@/repositories/postgres/passwordReset.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { invalidateAllUserSessions } from '@/services/session.service';
import { generateSecureTokenNoSalt } from '@/utils/cryptoUtils';

const TOKEN_EXPIRY_HOURS = 1;

function generateResetToken(): string {
  return generateSecureTokenNoSalt();
}

function getTokenExpiryDate(): Date {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + TOKEN_EXPIRY_HOURS);
  return expiryDate;
}

export async function initiatePasswordReset(forgotPasswordData: ForgotPasswordData) {
  try {
    const user = await findUserByEmail(forgotPasswordData.email);

    // Always return true for security (we don't want to reveal if email exists)
    if (!user) {
      return true;
    }

    // Block reset for OAuth-only accounts (no local password set)
    if (!user.passwordHash) {
      return true;
    }

    await deleteUserPasswordResetTokens(user.id);

    const resetToken = generateResetToken();
    const expiryDate = getTokenExpiryDate();

    await createPasswordResetToken(user.id, resetToken, expiryDate);

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    await enqueueEmail({
      type: 'reset-password',
      recipientKey: createUserRecipientKey(user.id),
      campaignKey: `reset-password:${resetToken}`,
      data: {
        to: user.email,
        userName: user.name,
        resetUrl,
        expirationTime: `${TOKEN_EXPIRY_HOURS} hour${TOKEN_EXPIRY_HOURS > 1 ? 's' : ''}`,
      },
    });

    return true;
  } catch (error) {
    console.error('Error during password reset initiation:', error);
    throw new Error('Failed to initiate password reset. Please try again.');
  }
}

export async function resetPassword(resetPasswordData: ResetPasswordData) {
  try {
    const resetToken = await findPasswordResetToken(resetPasswordData.token);

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    if (new Date() > resetToken.expires) {
      await deletePasswordResetToken(resetPasswordData.token);
      throw new Error('Reset token has expired');
    }

    // Ensure user currently has a password (blocks OAuth-only users)
    const targetUser = await findUserById(resetToken.userId);

    if (!targetUser?.passwordHash) {
      throw new Error('Password reset is not available for OAuth accounts');
    }

    await updateUserPassword(resetToken.userId, resetPasswordData.newPassword);

    await invalidateAllUserSessions(resetToken.userId);

    await deleteUserPasswordResetTokens(resetToken.userId);

    if (targetUser.email) {
      await sendPasswordChangedNotification(targetUser.id, targetUser.email, targetUser.name);
    }

    return true;
  } catch (error) {
    console.error('Error during password reset:', error);
    throw new Error('Failed to reset password');
  }
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
        resetPasswordUrl: `${process.env.NEXTAUTH_URL}/forgot-password`,
      },
    });
  } catch (err) {
    console.error('Failed to enqueue password-changed notification:', { userId, err });
  }
}

export async function validateResetToken(token: string) {
  try {
    const resetToken = await findPasswordResetToken(token);

    if (!resetToken) {
      return false;
    }

    if (new Date() > resetToken.expires) {
      await deletePasswordResetToken(token);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating reset token:', error);
    return false;
  }
}
