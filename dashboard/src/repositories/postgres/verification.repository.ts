import prisma from '@/lib/postgres';
import { CreateVerificationTokenData, VerificationToken } from '@/entities/account/verification';

export async function createVerificationToken(data: CreateVerificationTokenData): Promise<VerificationToken> {
  try {
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: data.identifier,
        token: data.token,
        expires: data.expires,
      },
    });

    return verificationToken;
  } catch (error) {
    console.error('Error creating verification token:', error);
    throw new Error('Failed to create verification token.');
  }
}

export async function findVerificationToken(token: string): Promise<VerificationToken | null> {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    return verificationToken;
  } catch (error) {
    console.error('Error finding verification token:', error);
    throw new Error('Failed to find verification token.');
  }
}

export async function findVerificationTokenByIdentifier(identifier: string): Promise<VerificationToken | null> {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier },
      orderBy: { createdAt: 'desc' },
    });

    return verificationToken;
  } catch (error) {
    console.error('Error finding verification token by identifier:', error);
    throw new Error('Failed to find verification token by identifier.');
  }
}

export async function deleteVerificationToken(token: string): Promise<void> {
  try {
    await prisma.verificationToken.delete({
      where: { token },
    });
  } catch (error) {
    console.error('Error deleting verification token:', error);
    throw new Error('Failed to delete verification token.');
  }
}

export async function deleteExpiredVerificationTokens(): Promise<void> {
  try {
    await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error deleting expired verification tokens:', error);
    throw new Error('Failed to delete expired verification tokens.');
  }
}

export async function markUserEmailAsVerified(email: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
  } catch (error) {
    console.error('Error marking user email as verified:', error);
    throw new Error('Failed to mark user email as verified.');
  }
}
