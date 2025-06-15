import prisma from '@/lib/postgres';
import { Subscription, SubscriptionSchema } from '@/entities/billing';

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await createDefaultStarterSubscription(userId);
    }

    return SubscriptionSchema.parse(subscription);
  } catch (error) {
    console.error('Failed to get user subscription:', error);
    return null;
  }
}

async function createDefaultStarterSubscription(userId: string): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.create({
    data: {
      user: { connect: { id: userId } },
      tier: 'growth',
      eventLimit: 10000,
      pricePerMonth: 0,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: 'active',
      cancelAtPeriodEnd: false,
    },
  });

  return SubscriptionSchema.parse(subscription);
}

export async function upsertSubscription(data: {
  userId: string;
  tier: string;
  status: string;
  eventLimit: number;
  pricePerMonth: number;
  paymentCustomerId?: string;
  paymentSubscriptionId?: string;
  paymentPriceId?: string;
}): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.upsert({
    where: { userId: data.userId },
    create: {
      user: { connect: { id: data.userId } },
      tier: data.tier,
      status: data.status,
      eventLimit: data.eventLimit,
      pricePerMonth: data.pricePerMonth,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      paymentCustomerId: data.paymentCustomerId,
      paymentSubscriptionId: data.paymentSubscriptionId,
      paymentPriceId: data.paymentPriceId,
    },
    update: {
      tier: data.tier,
      eventLimit: data.eventLimit,
      pricePerMonth: data.pricePerMonth,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: 'active',
      cancelAtPeriodEnd: false,
      paymentCustomerId: data.paymentCustomerId,
      paymentSubscriptionId: data.paymentSubscriptionId,
      paymentPriceId: data.paymentPriceId,
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
