'server-only';

import { ForgotPasswordData, ResetPasswordData } from '@/entities/auth/passwordReset';
import { findUserByEmail, findUserById, updateUserPassword } from '@/repositories/postgres/user.repository';
import {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  deleteUserPasswordResetTokens,
} from '@/repositories/postgres/passwordReset.repository';
import { sendResetPasswordEmail } from '@/services/email/mail.service';
import { generateSecureTokenNoSalt } from '@/utils/cryptoUtils';
import { getDisplayName } from '@/utils/userUtils';

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

    try {
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
      await sendResetPasswordEmail({
        to: user.email,
        userName: getDisplayName(user.name, user.email),
        resetUrl,
        expirationTime: `${TOKEN_EXPIRY_HOURS} hour${TOKEN_EXPIRY_HOURS > 1 ? 's' : ''}`,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

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

    await deleteUserPasswordResetTokens(resetToken.userId);

    return true;
  } catch (error) {
    console.error('Error during password reset:', error);
    throw new Error('Failed to reset password');
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
