import Stripe from 'stripe';
import {
  upsertSubscription,
  updateSubscriptionStatus,
  getSubscriptionByPaymentId,
} from '@/repositories/postgres/subscription';
import { createBillingHistoryEntry } from '@/repositories/postgres/billingHistory';
import { stripe } from '@/lib/billing/stripe';
import { getTierConfigFromLookupKey } from '@/lib/billing/plans';

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    if (!session.metadata?.userId) {
      throw new Error('No userId in session metadata');
    }

    if (!session.subscription) {
      throw new Error('No subscription in session');
    }

    const { userId } = session.metadata;
    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const subscriptionItem = stripeSubscription.items.data[0];
    const pricePerMonth = subscriptionItem.price.unit_amount || 0;

    const tierConfig = getTierConfigFromLookupKey(subscriptionItem.price.lookup_key);

    if (!tierConfig) {
      throw new Error(`Unknown price lookup key: ${subscriptionItem.price.lookup_key}`);
    }

    await upsertSubscription({
      userId,
      tier: tierConfig.tier,
      status: 'active',
      eventLimit: tierConfig.eventLimit,
      pricePerMonth,
      paymentCustomerId: stripeSubscription.customer as string,
      paymentSubscriptionId: session.subscription as string,
      paymentPriceId: subscriptionItem.price.id,
    });
  } catch (error) {
    console.error('Error handling checkout completed:', error);
    throw error;
  }
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionDetails = invoice.parent?.subscription_details;

    if (!subscriptionDetails || !subscriptionDetails.subscription) {
      console.log('Invoice has no subscription details, skipping');
      return;
    }

    const subscriptionId = subscriptionDetails.subscription as string;
    const subscription = await getSubscriptionByPaymentId(subscriptionId);

    if (!subscription) {
      console.log('No local subscription found for Stripe subscription:', subscriptionId);
      return;
    }

    await createBillingHistoryEntry({
      userId: subscription.userId,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      eventCount: 0,
      eventLimit: subscription.eventLimit,
      amountPaid: invoice.amount_paid,
      paymentInvoiceId: invoice.id,
      paymentPaymentIntentId: undefined,
      status: 'paid',
    });
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionDetails = invoice.parent?.subscription_details;

    if (!subscriptionDetails || !subscriptionDetails.subscription) {
      console.log('Invoice payment failed but has no subscription details, skipping');
      return;
    }

    const subscriptionId = subscriptionDetails.subscription as string;
    const subscription = await getSubscriptionByPaymentId(subscriptionId);

    if (!subscription) {
      console.log('No local subscription found for failed payment:', subscriptionId);
      return;
    }

    await updateSubscriptionStatus(subscription.userId, 'past_due');
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const localSubscription = await getSubscriptionByPaymentId(subscription.id);
    if (!localSubscription) {
      console.log('No local subscription found for Stripe subscription:', subscription.id);
      return;
    }

    await updateSubscriptionStatus(localSubscription.userId, 'canceled', true);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}
