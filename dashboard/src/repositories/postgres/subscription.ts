import prisma from '@/lib/postgres';
import {
  STARTER_SUBSCRIPTION_STATIC,
  Subscription,
  SubscriptionSchema,
  UpsertSubscriptionData,
  UpsertSubscriptionSchema,
  buildStarterSubscriptionWindow,
} from '@/entities/billing';

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { currentPeriodStart, currentPeriodEnd } = buildStarterSubscriptionWindow();

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        ...STARTER_SUBSCRIPTION_STATIC,
        currentPeriodStart,
        currentPeriodEnd,
      },
      update: {},
    });

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
