import prisma from '@/lib/postgres';
import { PasswordResetToken, PasswordResetTokenSchema } from '@/entities/passwordReset';

export async function createPasswordResetToken(
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<PasswordResetToken> {
  try {
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
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
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
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
    await prisma.passwordResetToken.delete({
      where: { token },
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
