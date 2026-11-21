import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubscriptionWithOwnedSites } from '@/entities/billing/billing.entities';
import type { SendEmailPayload } from '@/services/email/email-types';

const PERIOD_START = new Date('2026-11-01T00:00:00.000Z');
const PERIOD_END = new Date('2026-12-01T00:00:00.000Z');

const state = vi.hoisted(() => ({
  sub: null as unknown as SubscriptionWithOwnedSites,
  usage: 0,
  // recipientKey -> sent campaignKeys, as recorded by the email worker.
  sent: new Map<string, Set<string>>(),
  enqueued: [] as Array<{ recipientKey: string; campaignKey: string }>,
}));

// Keeps Prisma and ClickHouse out of the import graph; the in-memory store stands in for sent_emails.
vi.mock('@/repositories/postgres/subscription.repository', () => ({
  findActiveSubscriptionsWithOwnedSites: vi.fn(async () => [state.sub]),
  updateSubscriptionPeriod: vi.fn(),
}));

vi.mock('@/repositories/clickhouse/usage.repository', () => ({
  getDailyEventCountsForSites: vi.fn(async () => [{ siteId: 'site-1', date: '2026-11-02', total: state.usage }]),
}));

vi.mock('@/repositories/postgres/sentEmail.repository', () => ({
  findSentCampaignKeysByRecipient: vi.fn(async (recipientKeys: string[], campaignKeys: string[]) => {
    const out = new Map<string, Set<string>>();
    for (const recipientKey of recipientKeys) {
      const matching = [...(state.sent.get(recipientKey) ?? [])].filter((key) => campaignKeys.includes(key));
      if (matching.length > 0) out.set(recipientKey, new Set(matching));
    }
    return out;
  }),
}));

vi.mock('@/services/email/email.service', () => ({
  enqueueEmail: vi.fn(async ({ recipientKey, campaignKey }: SendEmailPayload) => {
    state.enqueued.push({ recipientKey, campaignKey });
    return 'enqueued';
  }),
}));

import { usageThresholdScanJob } from '@/worker/jobs/billing/usage-threshold-scan.job';

const RECIPIENT = 'user:user-1';

function subscription(eventLimit: number): SubscriptionWithOwnedSites {
  return {
    userId: 'user-1',
    userEmail: 'owner@example.com',
    userName: 'Owner',
    planId: 'growth',
    eventLimit,
    currentPeriodStart: PERIOD_START,
    currentPeriodEnd: PERIOD_END,
    paymentSubscriptionId: 'sub_123',
    siteIds: ['site-1'],
  };
}

function markSent(campaignKey: string) {
  const keys = state.sent.get(RECIPIENT) ?? new Set<string>();
  keys.add(campaignKey);
  state.sent.set(RECIPIENT, keys);
}

// Runs one scan at the given limit and usage, then lets the worker record what was enqueued.
async function scan(eventLimit: number, usage: number): Promise<string[]> {
  state.sub = subscription(eventLimit);
  state.usage = usage;
  state.enqueued = [];
  await usageThresholdScanJob.handler(undefined);
  for (const { campaignKey } of state.enqueued) markSent(campaignKey);
  return state.enqueued.map((e) => e.campaignKey);
}

const key = (kind: string, limit: number) => `usage-alert:${kind}:${PERIOD_START.toISOString()}:${limit}`;
const legacyKey = (kind: string) => `usage-alert:${kind}:${PERIOD_START.toISOString()}`;

describe('usage threshold scan', () => {
  beforeEach(() => {
    state.sent = new Map();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('sends each alert once per period when the limit is unchanged', async () => {
    expect(await scan(10_000, 8_500)).toEqual([key('approaching', 10_000)]);
    expect(await scan(10_000, 9_000)).toEqual([]);
    expect(await scan(10_000, 10_500)).toEqual([key('exceeded', 10_000)]);
    expect(await scan(10_000, 12_000)).toEqual([]);
  });

  it('re-arms both alerts after a mid-period upgrade raises the limit', async () => {
    await scan(10_000, 8_500);
    await scan(10_000, 10_500);

    expect(await scan(50_000, 12_000)).toEqual([]);
    expect(await scan(50_000, 41_000)).toEqual([key('approaching', 50_000)]);
    expect(await scan(50_000, 45_000)).toEqual([]);
    expect(await scan(50_000, 50_000)).toEqual([key('exceeded', 50_000)]);
    expect(await scan(50_000, 55_000)).toEqual([]);
  });

  it('re-arms both alerts after a mid-period downgrade lowers the limit', async () => {
    await scan(50_000, 41_000);

    expect(await scan(10_000, 8_200)).toEqual([key('approaching', 10_000)]);
    expect(await scan(10_000, 10_000)).toEqual([key('exceeded', 10_000)]);
    expect(await scan(10_000, 11_000)).toEqual([]);
  });

  it('does not resend when returning to a limit already alerted at in the period', async () => {
    await scan(10_000, 8_500);
    await scan(50_000, 41_000);

    expect(await scan(10_000, 9_000)).toEqual([]);
  });

  it('treats an alert sent under the legacy key as sent for the rest of the period, whatever the limit', async () => {
    markSent(legacyKey('approaching'));
    markSent(legacyKey('exceeded'));

    expect(await scan(10_000, 9_000)).toEqual([]);
    expect(await scan(10_000, 11_000)).toEqual([]);
    expect(await scan(50_000, 45_000)).toEqual([]);
    expect(await scan(50_000, 60_000)).toEqual([]);
  });

  it('a legacy alert only suppresses its own kind', async () => {
    markSent(legacyKey('approaching'));

    expect(await scan(10_000, 10_500)).toEqual([key('exceeded', 10_000)]);
  });

  it('logs only the alerts it actually enqueued', async () => {
    await scan(10_000, 8_500);
    await scan(10_000, 9_000);

    expect(console.info).toHaveBeenLastCalledWith(
      'usage-threshold-scan: scanned 1 subs, enqueued 0 emails, skipped 1 already sent',
    );
  });
});
