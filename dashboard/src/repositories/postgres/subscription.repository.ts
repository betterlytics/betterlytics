import prisma from '@/lib/postgres';
import {
  Subscription,
  SubscriptionSchema,
  SubscriptionWithOwnedSites,
  SubscriptionWithOwnedSitesSchema,
  SubscriptionEndingSoonCandidate,
  SubscriptionEndingSoonCandidateSchema,
  UpsertSubscriptionData,
  UpsertSubscriptionSchema,
  buildStarterSubscription,
} from '@/entities/billing/billing.entities';
import { addMonths, startOfDay } from 'date-fns';

export async function findActiveSubscriptionsWithOwnedSites(): Promise<SubscriptionWithOwnedSites[]> {
  const subs = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'past_due'] },
      user: { email: { not: null } },
    },
    select: {
      userId: true,
      tier: true,
      eventLimit: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      paymentSubscriptionId: true,
      user: {
        select: {
          email: true,
          name: true,
          dashboardAccess: {
            where: { role: 'owner' },
            select: { dashboard: { select: { siteId: true } } },
          },
        },
      },
    },
  });

  return subs.map((s) =>
    SubscriptionWithOwnedSitesSchema.parse({
      userId: s.userId,
      userEmail: s.user.email,
      userName: s.user.name,
      tier: s.tier,
      eventLimit: s.eventLimit,
      currentPeriodStart: s.currentPeriodStart,
      currentPeriodEnd: s.currentPeriodEnd,
      paymentSubscriptionId: s.paymentSubscriptionId,
      siteIds: s.user.dashboardAccess.map((ud) => ud.dashboard.siteId),
    }),
  );
}

export async function updateSubscriptionPeriod(
  userId: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
): Promise<{ currentPeriodStart: Date; currentPeriodEnd: Date }> {
  return prisma.subscription.update({
    where: { userId },
    data: { currentPeriodStart, currentPeriodEnd },
    select: { currentPeriodStart: true, currentPeriodEnd: true },
  });
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const starterSubscription = buildStarterSubscription();

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        ...starterSubscription,
      },
      update: {},
    });

    const isFreeTier = !subscription.paymentSubscriptionId;
    const isPeriodExpired = subscription.currentPeriodEnd < new Date();

    if (isFreeTier && isPeriodExpired) {
      let newStart = startOfDay(subscription.currentPeriodEnd);
      let newEnd = addMonths(newStart, 1);
      const now = new Date();
      while (newEnd < now) {
        newStart = newEnd;
        newEnd = addMonths(newStart, 1);
      }
      const updated = await prisma.subscription.update({
        where: { userId },
        data: {
          currentPeriodStart: newStart,
          currentPeriodEnd: newEnd,
        },
      });
      return SubscriptionSchema.parse(updated);
    }

    return SubscriptionSchema.parse(subscription);
  } catch (error) {
    console.error('Failed to get user subscription:', error);
    return null;
  }
}

export async function upsertSubscription(data: UpsertSubscriptionData): Promise<Subscription> {
  const validatedData = UpsertSubscriptionSchema.parse(data);

  const { userId, ...subscriptionData } = validatedData;

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    create: {
      user: { connect: { id: userId } },
      ...subscriptionData,
    },
    update: {
      ...subscriptionData,
    },
  });

  return SubscriptionSchema.parse(subscription);
}

export async function setSubscriptionPaymentCustomerId(userId: string, paymentCustomerId: string): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      user: { connect: { id: userId } },
      ...buildStarterSubscription(),
      paymentCustomerId,
    },
    update: { paymentCustomerId },
  });
}

export async function updateSubscriptionStatus(
  userId: string,
  status: string,
  cancelAtPeriodEnd?: boolean,
): Promise<Subscription | null> {
  try {
    const subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        status,
        ...(cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd }),
      },
    });

    return SubscriptionSchema.parse(subscription);
  } catch (error) {
    console.error('Failed to update subscription status:', error);
    return null;
  }
}

export async function findSubscriptionsEndingSoon(endingBefore: Date): Promise<SubscriptionEndingSoonCandidate[]> {
  try {
    const subs = await prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: true,
        status: 'active',
        pricePerMonth: { gt: 0 },
        currentPeriodEnd: { lte: endingBefore, gte: new Date() },
        user: { email: { not: null }, deletedAt: null },
      },
      select: {
        userId: true,
        tier: true,
        currentPeriodEnd: true,
        user: { select: { email: true, name: true } },
      },
    });

    return subs.flatMap((s) => {
      if (!s.user.email) return [];
      return [
        SubscriptionEndingSoonCandidateSchema.parse({
          userId: s.userId,
          userEmail: s.user.email,
          userName: s.user.name,
          tier: s.tier,
          currentPeriodEnd: s.currentPeriodEnd,
        }),
      ];
    });
  } catch (error) {
    console.error('Failed to find subscriptions ending soon:', error);
    throw new Error('Failed to find subscriptions ending soon');
  }
}

export async function getSubscriptionByPaymentId(paymentSubscriptionId: string): Promise<Subscription | null> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { paymentSubscriptionId },
    });

    return subscription ? SubscriptionSchema.parse(subscription) : null;
  } catch (error) {
    console.error('Failed to get subscription by payment ID:', error);
    return null;
  }
}
