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

/**
 * Returns the sent campaignKeys per recipientKey, limited to the given recipients and campaigns.
 * Use to bulk pre-dedup when the campaign key differs per recipient.
 */
export async function findSentCampaignKeysByRecipient(
  recipientKeys: string[],
  campaignKeys: string[],
): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  if (recipientKeys.length === 0 || campaignKeys.length === 0) return out;
  const rows = await prisma.sentEmail.findMany({
    where: { recipientKey: { in: recipientKeys }, campaignKey: { in: campaignKeys } },
    select: { recipientKey: true, campaignKey: true },
  });
  for (const row of rows) {
    const keys = out.get(row.recipientKey);
    if (keys) keys.add(row.campaignKey);
    else out.set(row.recipientKey, new Set([row.campaignKey]));
  }
  return out;
}
