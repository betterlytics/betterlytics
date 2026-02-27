import prisma from '@/lib/postgres';
import {
  Subscription,
  SubscriptionSchema,
  UpsertSubscriptionData,
  UpsertSubscriptionSchema,
  buildStarterSubscription,
} from '@/entities/billing/billing.entities';
import { addMonths, startOfDay } from 'date-fns';

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
      const now = startOfDay(new Date());
      const updated = await prisma.subscription.update({
        where: { userId },
        data: {
          currentPeriodStart: now,
          currentPeriodEnd: addMonths(now, 1),
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
