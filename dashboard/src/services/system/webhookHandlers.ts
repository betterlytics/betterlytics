import Stripe from 'stripe';
import type { Currency } from '@/entities/billing';
import { stripe } from '@/lib/billing/stripe';
import { getTierConfigFromLookupKey } from '@/lib/billing/plans';
import { addMonths } from 'date-fns';
import {
  findSubscriptionByPaymentId,
  setSubscriptionStatus,
  upsertUserSubscription,
} from '@/services/billing/subscription.service';

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

    const tierConfig = getTierConfigFromLookupKey(subscriptionItem.price.lookup_key as string);
    const paymentCurrency = session.currency || subscriptionItem.price.currency;
    const pricePerMonth = await getPriceAmountByCurrency(subscriptionItem.price.id, paymentCurrency);

    await upsertUserSubscription({
      userId,
      tier: tierConfig.tier,
      status: 'active',
      eventLimit: tierConfig.eventLimit,
      pricePerMonth,
      currency: paymentCurrency.toUpperCase() as Currency,
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
      paymentCustomerId: stripeSubscription.customer as string,
      paymentSubscriptionId: session.subscription as string,
      paymentPriceId: subscriptionItem.price.id,
    });
  } catch (error) {
    console.error('Error handling checkout completed:', error);
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
    const subscription = await findSubscriptionByPaymentId(subscriptionId);

    if (!subscription) {
      console.log('No local subscription found for failed payment:', subscriptionId);
      return;
    }

    await setSubscriptionStatus(subscription.userId, 'past_due');
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const localSubscription = await findSubscriptionByPaymentId(subscription.id);
    if (!localSubscription) {
      console.log('No local subscription found for Stripe subscription:', subscription.id);
      return;
    }

    const now = new Date();

    // Downgrade to free Growth plan
    await upsertUserSubscription({
      userId: localSubscription.userId,
      tier: 'growth',
      status: 'active',
      eventLimit: 10000,
      pricePerMonth: 0,
      currency: localSubscription.currency,
      currentPeriodStart: now,
      currentPeriodEnd: addMonths(now, 1),
      cancelAtPeriodEnd: false,
      paymentSubscriptionId: undefined,
      paymentPriceId: undefined,
    });
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const localSubscription = await findSubscriptionByPaymentId(subscription.id);
    if (!localSubscription) {
      throw new Error(`No local subscription found for Stripe subscription: ${subscription.id}`);
    }

    const subscriptionItem = subscription.items.data[0];
    const tierConfig = getTierConfigFromLookupKey(subscriptionItem.price.lookup_key as string);
    const pricePerMonth = await getPriceAmountByCurrency(subscriptionItem.price.id, localSubscription.currency);

    await upsertUserSubscription({
      userId: localSubscription.userId,
      tier: tierConfig.tier,
      status: subscription.status,
      eventLimit: tierConfig.eventLimit,
      pricePerMonth,
      currency: subscription.currency.toUpperCase() as Currency,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
      paymentCustomerId: subscription.customer as string,
      paymentSubscriptionId: subscription.id,
      paymentPriceId: subscriptionItem.price.id,
    });
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function getPriceAmountByCurrency(priceId: string, currency: string): Promise<number> {
  const priceWithOptions = await stripe.prices.retrieve(priceId, {
    expand: ['currency_options'],
  });

  const currencyLower = currency.toLowerCase();

  if (!priceWithOptions.unit_amount) {
    throw new Error('Price has no unit_amount, price: ' + JSON.stringify(priceWithOptions));
  }

  if (priceWithOptions.currency_options && currencyLower in priceWithOptions.currency_options) {
    const currencyOption = priceWithOptions.currency_options[currencyLower];
    return currencyOption.unit_amount ?? 0;
  }

  return priceWithOptions.unit_amount;
}
