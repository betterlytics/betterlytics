import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findActiveSubscriptionsWithOwnedSites } from '@/repositories/postgres/subscription.repository';

const prismaMock = vi.hoisted(() => ({
  subscription: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/postgres', () => ({
  default: prismaMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findActiveSubscriptionsWithOwnedSites', () => {
  it('only selects active or past due subscriptions of accounts that are not deleted', async () => {
    prismaMock.subscription.findMany.mockResolvedValue([]);

    await findActiveSubscriptionsWithOwnedSites();

    const { where } = prismaMock.subscription.findMany.mock.calls[0][0];
    expect(where).toEqual({
      status: { in: ['active', 'past_due'] },
      user: { deletedAt: null },
    });
  });

  it('does not filter out disabled accounts', async () => {
    prismaMock.subscription.findMany.mockResolvedValue([]);

    await findActiveSubscriptionsWithOwnedSites();

    const { where } = prismaMock.subscription.findMany.mock.calls[0][0];
    expect(where.user).not.toHaveProperty('disabledAt');
  });

  it('maps each subscription to its owner and owned sites', async () => {
    const currentPeriodStart = new Date('2026-10-01T00:00:00Z');
    const currentPeriodEnd = new Date('2026-11-01T00:00:00Z');
    prismaMock.subscription.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        planId: 'growth',
        eventLimit: 10_000,
        currentPeriodStart,
        currentPeriodEnd,
        paymentSubscriptionId: null,
        user: {
          email: 'owner@example.com',
          name: 'Owner',
          dashboardAccess: [{ dashboard: { siteId: 'site-a' } }, { dashboard: { siteId: 'site-b' } }],
        },
      },
    ]);

    expect(await findActiveSubscriptionsWithOwnedSites()).toEqual([
      {
        userId: 'user-1',
        userEmail: 'owner@example.com',
        userName: 'Owner',
        planId: 'growth',
        eventLimit: 10_000,
        currentPeriodStart,
        currentPeriodEnd,
        paymentSubscriptionId: null,
        siteIds: ['site-a', 'site-b'],
      },
    ]);
  });
});
