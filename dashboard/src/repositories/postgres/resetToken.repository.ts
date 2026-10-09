import prisma from '@/lib/postgres';

// better-auth stores reset tokens in Verification as identifier `reset-password:<x>`, value = userId
export const RESET_TOKEN_PREFIX = 'reset-password:';

export async function findResetTokenUserId(identifier: string): Promise<string | null> {
  try {
    const row = await prisma.verification.findFirst({
      where: { identifier, expiresAt: { gt: new Date() } },
    });
    return row?.value ?? null;
  } catch (error) {
    console.error('Error finding reset token:', error);
    return null;
  }
}

export async function replaceUserResetToken(userId: string, identifier: string, expiresAt: Date): Promise<void> {
  await prisma.$transaction([
    prisma.verification.deleteMany({ where: { value: userId, identifier: { startsWith: RESET_TOKEN_PREFIX } } }),
    prisma.verification.create({ data: { identifier, value: userId, expiresAt } }),
  ]);
}

export async function deleteUserResetTokens(userId: string, keepIdentifier?: string): Promise<void> {
  await prisma.verification.deleteMany({
    where: {
      value: userId,
      identifier: { startsWith: RESET_TOKEN_PREFIX, ...(keepIdentifier ? { not: keepIdentifier } : {}) },
    },
  });
}
