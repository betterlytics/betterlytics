import prisma from '@/lib/postgres';

// Answered consent requests, kept in Verification as identifier `mcp-consent-answered:<key>` until they expire
const ANSWERED_PREFIX = 'mcp-consent-answered:';

export async function isMcpConsentRequestAnswered(requestKey: string): Promise<boolean> {
  const row = await prisma.verification.findFirst({
    where: { identifier: `${ANSWERED_PREFIX}${requestKey}`, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return row !== null;
}

/** Records the request as answered, and drops the records of requests that have expired since. */
export async function markMcpConsentRequestAnswered(requestKey: string, expiresAt: Date): Promise<void> {
  await prisma.$transaction([
    prisma.verification.deleteMany({
      where: { identifier: { startsWith: ANSWERED_PREFIX }, expiresAt: { lte: new Date() } },
    }),
    prisma.verification.create({
      data: { identifier: `${ANSWERED_PREFIX}${requestKey}`, value: '1', expiresAt },
    }),
  ]);
}
