import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SubscriptionWithOwnedSites } from '@/entities/billing/billing.entities';

vi.mock('@/repositories/postgres/subscription.repository', () => ({}));
vi.mock('@/repositories/clickhouse/usage.repository', () => ({}));

const { indexUsageBySite, sumRecordedSessionsForSubscription } = await import(
  '@/services/billing/usage-scan.service'
);

const sub: SubscriptionWithOwnedSites = {
  userId: 'user-1',
  userEmail: 'user@example.com',
  userName: null,
  tier: 'growth',
  eventLimit: 10_000,
  // Local midnight in Copenhagen, stored as 22:00 UTC the day before.
  currentPeriodStart: new Date('2026-10-23T22:00:00.000Z'),
  currentPeriodEnd: new Date('2026-11-23T23:00:00.000Z'),
  paymentSubscriptionId: null,
  siteIds: ['site-a', 'site-b'],
};

describe('sumRecordedSessionsForSubscription', () => {
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'Europe/Copenhagen';
  });
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('counts sessions from the UTC day the period starts on, whatever the server time zone', () => {
    const bySite = indexUsageBySite([
      { siteId: 'site-a', date: '2026-10-22', total: 7 },
      { siteId: 'site-a', date: '2026-10-23', total: 400 },
      { siteId: 'site-b', date: '2026-10-24', total: 100 },
      { siteId: 'site-other', date: '2026-10-24', total: 50 },
    ]);

    expect(sumRecordedSessionsForSubscription(sub, bySite)).toBe(500);
  });
});
