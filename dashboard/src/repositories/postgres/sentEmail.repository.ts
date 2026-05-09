import prisma from '@/lib/postgres';

export async function hasBeenSent(recipientKey: string, campaignKey: string): Promise<boolean> {
  const row = await prisma.sentEmail.findUnique({
    where: { recipientKey_campaignKey: { recipientKey, campaignKey } },
    select: { id: true },
  });
  return row !== null;
}

export async function recordSent(
  recipientKey: string,
  campaignKey: string,
  providerMessageId: string | null,
): Promise<void> {
  await prisma.sentEmail.createMany({
    data: [{ recipientKey, campaignKey, providerMessageId }],
    skipDuplicates: true,
  });
}
