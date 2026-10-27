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

/**
 * Returns the set of recipientKeys that already have a sent email for the given campaign.
 * Use to bulk pre-dedup candidate sets before enqueueing emails.
 */
export async function findSentRecipientKeys(recipientKeys: string[], campaignKey: string): Promise<Set<string>> {
  if (recipientKeys.length === 0) return new Set();
  const rows = await prisma.sentEmail.findMany({
    where: { campaignKey, recipientKey: { in: recipientKeys } },
    select: { recipientKey: true },
  });
  return new Set(rows.map((r) => r.recipientKey));
}

/** Campaign keys already sent to each recipient whose key starts with the prefix, for campaigns keyed per episode. */
export async function findSentCampaignKeysByPrefix(
  recipientKeys: string[],
  campaignKeyPrefix: string,
): Promise<Map<string, string[]>> {
  if (recipientKeys.length === 0) return new Map();
  const rows = await prisma.sentEmail.findMany({
    where: { recipientKey: { in: recipientKeys }, campaignKey: { startsWith: campaignKeyPrefix } },
    select: { recipientKey: true, campaignKey: true },
  });
  const byRecipient = new Map<string, string[]>();
  for (const row of rows) {
    byRecipient.set(row.recipientKey, [...(byRecipient.get(row.recipientKey) ?? []), row.campaignKey]);
  }
  return byRecipient;
}
