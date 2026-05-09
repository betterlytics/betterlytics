import prisma from '@/lib/postgres';
import {
  Subscription,
  SubscriptionSchema,
  SubscriptionForUsageScan,
  SubscriptionForUsageScanSchema,
  UpsertSubscriptionData,
  UpsertSubscriptionSchema,
  buildStarterSubscription,
} from '@/entities/billing/billing.entities';
import { addMonths, startOfDay } from 'date-fns';

type FreeTierExpiryFields = {
  paymentSubscriptionId: string | null;
  currentPeriodEnd: Date;
};

function isFreeTierAndExpired(sub: FreeTierExpiryFields): boolean {
  return !sub.paymentSubscriptionId && sub.currentPeriodEnd < new Date();
}

async function rollForwardFreeTierPeriod(
  userId: string,
  previousEnd: Date,
): Promise<{ currentPeriodStart: Date; currentPeriodEnd: Date }> {
  let start = startOfDay(previousEnd);
  let end = addMonths(start, 1);
  const now = new Date();
  while (end < now) {
    start = end;
    end = addMonths(start, 1);
  }
  return prisma.subscription.update({
    where: { userId },
    data: { currentPeriodStart: start, currentPeriodEnd: end },
    select: { currentPeriodStart: true, currentPeriodEnd: true },
  });
}

export async function findSubscriptionsForUsageScan(): Promise<SubscriptionForUsageScan[]> {
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

  return subs
    .filter((s) => s.user.email !== null && s.user.dashboardAccess.length > 0)
    .map((s) =>
      SubscriptionForUsageScanSchema.parse({
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

export async function rollForwardStaleFreeTierPeriods(
  subs: SubscriptionForUsageScan[],
): Promise<SubscriptionForUsageScan[]> {
  return Promise.all(
    subs.map(async (s) => {
      if (!isFreeTierAndExpired(s)) return s;
      const rolled = await rollForwardFreeTierPeriod(s.userId, s.currentPeriodEnd);
      return { ...s, ...rolled };
    }),
  );
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

    if (isFreeTierAndExpired(subscription)) {
      const rolled = await rollForwardFreeTierPeriod(subscription.userId, subscription.currentPeriodEnd);
      return SubscriptionSchema.parse({ ...subscription, ...rolled });
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
