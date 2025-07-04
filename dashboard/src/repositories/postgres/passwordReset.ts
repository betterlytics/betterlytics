import prisma from '@/lib/postgres';
import * as crypto from 'crypto';
import { PasswordResetToken, PasswordResetTokenSchema } from '@/entities/passwordReset';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<PasswordResetToken> {
  try {
    const tokenHash = hashToken(token);

    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId,
        token: tokenHash,
        expires: expiresAt,
      },
    });

    return PasswordResetTokenSchema.parse(resetToken);
  } catch (error) {
    console.error('Error creating password reset token:', error);
    throw new Error('Failed to create password reset token.');
  }
}

export async function findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  try {
    const tokenHash = hashToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!resetToken) return null;

    return PasswordResetTokenSchema.parse(resetToken);
  } catch (error) {
    console.error(`Error finding password reset token:`, error);
    throw new Error('Failed to find password reset token.');
  }
}

export async function deletePasswordResetToken(token: string) {
  try {
    const tokenHash = hashToken(token);

    await prisma.passwordResetToken.delete({
      where: { token: tokenHash },
    });
  } catch (error) {
    console.error(`Error deleting password reset token:`, error);
    throw new Error('Failed to delete password reset token.');
  }
}

export async function deleteUserPasswordResetTokens(userId: string) {
  try {
    await prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error(`Error deleting password reset tokens for user ${userId}:`, error);
    throw new Error(`Failed to delete password reset tokens for user ${userId}.`);
  }
}
