import 'server-only';

import Stripe from 'stripe';
import { STARTER_SUBSCRIPTION_STATIC, type Currency } from '@/entities/billing/billing.entities';
import { stripe } from '@/lib/billing/stripe';
import { getTierConfigFromLookupKey, type TierName } from '@/lib/billing/plans';
import { getMaxRetentionDaysForTier } from '@/lib/billing/capabilities';
import { addDays } from 'date-fns';
import { env } from '@/lib/env';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { applyTierChangeToRetention } from '@/services/dashboard/dashboardSettings.service';
import { findUserById } from '@/repositories/postgres/user.repository';
import { findOwnedDashboardDomainsWithActiveRetentionGrace } from '@/repositories/postgres/dashboardSettings.repository';
import {
  clearScheduledCancellation,
  findSubscriptionByPaymentId,
  setSubscriptionStatus,
  upsertUserSubscription,
} from '@/services/billing/subscription.service';
import {
  LIVE_SUBSCRIPTION_STATUSES,
  TIER_RETAINING_STATUSES,
  TERMINAL_STATUSES,
} from '@/lib/billing/subscription-status';
import { NonRetryableWebhookError } from '@/lib/exceptions';

const RETENTION_GRACE_DAYS = 30;

function getTierConfigForWebhook(lookupKey: string | null | undefined): { tier: TierName; eventLimit: number } {
  if (!lookupKey) {
    throw new NonRetryableWebhookError('Subscription price has no lookup key');
  }
  try {
    return getTierConfigFromLookupKey(lookupKey);
  } catch {
    throw new NonRetryableWebhookError(`Unknown price lookup key: ${lookupKey}`);
  }
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  try {
    if (!session.metadata?.userId) {
      throw new NonRetryableWebhookError('No userId in session metadata');
    }

    if (!session.subscription) {
      throw new NonRetryableWebhookError('No subscription in session');
    }

    const { userId } = session.metadata;
    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);

    const verdict = await resolveDuplicateSubscriptions(
      stripeSubscription.customer as string,
      stripeSubscription.id,
    );
    if (verdict === 'duplicate') {
      console.warn(
        `Checkout ${session.id} created duplicate subscription ${stripeSubscription.id}; refunded, skipping provisioning`,
      );
      return;
    }

    const subscriptionItem = stripeSubscription.items.data[0];

    const tierConfig = getTierConfigForWebhook(subscriptionItem.price.lookup_key);
    const paymentCurrency = session.currency || subscriptionItem.price.currency;
    const pricePerMonth = await getPriceAmountByCurrency(subscriptionItem.price.id, paymentCurrency);

    await upsertUserSubscription({
      userId,
      tier: tierConfig.tier,
      status: stripeSubscription.status,
      eventLimit: tierConfig.eventLimit,
      pricePerMonth,
      currency: paymentCurrency.toUpperCase() as Currency,
      currencyLocked: true,
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
      paymentCustomerId: stripeSubscription.customer as string,
      paymentSubscriptionId: session.subscription as string,
      paymentPriceId: subscriptionItem.price.id,
    });

    await syncRetentionToTier(userId, tierConfig.tier, eventId);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
    throw error;
  }
}

async function resolveDuplicateSubscriptions(
  customerId: string,
  incomingSubscriptionId: string,
): Promise<'keep' | 'duplicate'> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  });

  const live = subscriptions.data
    .filter((sub) => LIVE_SUBSCRIPTION_STATUSES.has(sub.status))
    .sort((a, b) => a.created - b.created);

  const [winner, ...duplicates] = live;
  if (!winner || duplicates.length === 0) return 'keep';

  for (const duplicate of duplicates) {
    await cancelAndRefundDuplicate(duplicate);
  }

  return winner.id === incomingSubscriptionId ? 'keep' : 'duplicate';
}

async function cancelAndRefundDuplicate(subscription: Stripe.Subscription): Promise<void> {
  console.warn(`Canceling duplicate subscription ${subscription.id} for customer ${subscription.customer}`);

  await stripe.subscriptions.cancel(subscription.id).catch(() => {
    // Already canceled by a concurrent handler run
  });

  const invoiceId =
    typeof subscription.latest_invoice === 'string'
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id;
  if (!invoiceId) return;

  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ['payments.data.payment.payment_intent'],
  });

  const paymentIntent = (invoice.payments?.data ?? [])
    .map((invoicePayment) => invoicePayment.payment.payment_intent)
    .find(
      (intent): intent is Stripe.PaymentIntent =>
        intent != null && typeof intent !== 'string' && intent.status === 'succeeded',
    );
  if (!paymentIntent) return;

  // Idempotency key makes the refund race-safe if both webhook deliveries
  // process the same duplicate concurrently
  await stripe.refunds.create(
    { payment_intent: paymentIntent.id },
    { idempotencyKey: `dup-refund:${subscription.id}` },
  );
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

    if (subscription.status === 'past_due' || subscription.status === 'unpaid') return;

    const fresh = await stripe.subscriptions.retrieve(subscriptionId);
    if (fresh.status !== 'past_due' && fresh.status !== 'unpaid') {
      console.log('Skipping stale invoice.payment_failed; Stripe shows', fresh.status);
      return;
    }

    await setSubscriptionStatus(subscription.userId, fresh.status);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription, eventId: string) {
  try {
    const localSubscription = await findSubscriptionByPaymentId(subscription.id);
    if (!localSubscription) {
      console.log('No local subscription found for Stripe subscription:', subscription.id);
      return;
    }

    const previousStatus = localSubscription.status;
    const wasInvoluntary =
      subscription.cancellation_details?.reason === 'payment_failed' || previousStatus === 'past_due';

    // Terminal cancellation: detach the Stripe link entirely (a new subscription is required)
    await revokePaidEntitlement(localSubscription, null, eventId);

    if (wasInvoluntary) {
      await sendSubscriptionPaymentCancelledNotification(localSubscription.userId, eventId);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function sendSubscriptionPaymentCancelledNotification(userId: string, eventId: string): Promise<void> {
  try {
    const user = await findUserById(userId);
    if (!user?.email) {
      console.warn({ event: 'subscription-payment-cancelled:email-skipped', reason: 'no-email', userId });
      return;
    }
    const affectedDashboards = await findOwnedDashboardDomainsWithActiveRetentionGrace(userId);
    await enqueueEmail({
      type: 'subscription-payment-cancelled',
      recipientKey: createUserRecipientKey(userId),
      campaignKey: `subscription-payment-cancelled:${eventId}`,
      data: {
        to: user.email,
        userName: user.name,
        billingUrl: `${env.PUBLIC_BASE_URL}/billing`,
        freeEventLimit: STARTER_SUBSCRIPTION_STATIC.eventLimit,
        freeRetentionDays: getMaxRetentionDaysForTier(STARTER_SUBSCRIPTION_STATIC.tier),
        affectedDashboards,
      },
    });
  } catch (err) {
    console.error('Failed to enqueue subscription-payment-cancelled notification:', { userId, err });
  }
}

// Reset a user to the free Growth plan. Pass `link` to retain the Stripe association so a
// revivable subscription restores automatically on the next event
async function revokePaidEntitlement(
  localSubscription: {
    userId: string;
    currency: Currency;
    tier: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  },
  link: { customerId: string; subscriptionId: string; priceId: string } | null,
  eventId: string,
): Promise<void> {
  await upsertUserSubscription({
    ...STARTER_SUBSCRIPTION_STATIC,
    userId: localSubscription.userId,
    currency: localSubscription.currency,
    currentPeriodStart: localSubscription.currentPeriodStart,
    currentPeriodEnd: localSubscription.currentPeriodEnd,
    paymentCustomerId: link?.customerId,
    paymentSubscriptionId: link ? link.subscriptionId : null,
    paymentPriceId: link ? link.priceId : null,
  });

  if (localSubscription.tier !== STARTER_SUBSCRIPTION_STATIC.tier) {
    await syncRetentionToTier(localSubscription.userId, 'growth', eventId);
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription, eventId: string) {
  try {
    await syncSubscriptionFromStripe(subscription, eventId);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

export async function handlePendingUpdateApplied(subscription: Stripe.Subscription, eventId: string) {
  try {
    const sub = await clearScheduledCancellation(subscription);
    await syncSubscriptionFromStripe(sub, eventId);
  } catch (error) {
    console.error('Error handling pending update applied:', error);
    throw error;
  }
}

// Idempotent so concurrent calls are safe.
export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  eventId: string,
): Promise<void> {
  const localSubscription = await findSubscriptionByPaymentId(subscription.id);
  const fresh = await stripe.subscriptions.retrieve(subscription.id);

  if (!localSubscription) {
    if (TERMINAL_STATUSES.has(fresh.status)) {
      console.warn(
        `Ignoring stale subscription event ${eventId} for ${fresh.id} (no local row, status ${fresh.status})`,
      );
      return;
    }
    throw new NonRetryableWebhookError(`No local subscription found for Stripe subscription: ${subscription.id}`);
  }

  const subscriptionItem = fresh.items.data[0];

  // Keep the Stripe link for revivable states so a later payment restores the paid tier
  if (!TIER_RETAINING_STATUSES.has(fresh.status)) {
    const link = TERMINAL_STATUSES.has(fresh.status)
      ? null
      : { customerId: fresh.customer as string, subscriptionId: fresh.id, priceId: subscriptionItem.price.id };
    await revokePaidEntitlement(localSubscription, link, eventId);
    return;
  }

  const tierConfig = getTierConfigForWebhook(subscriptionItem.price.lookup_key);

  const pricePerMonth = await getPriceAmountByCurrency(
    subscriptionItem.price.id,
    fresh.currency.toUpperCase() as Currency,
  );

  const isCancelling = fresh.cancel_at_period_end || fresh.cancel_at !== null;

  await upsertUserSubscription({
    userId: localSubscription.userId,
    tier: tierConfig.tier,
    status: fresh.status,
    eventLimit: tierConfig.eventLimit,
    pricePerMonth,
    currency: fresh.currency.toUpperCase() as Currency,
    currencyLocked: true,
    cancelAtPeriodEnd: isCancelling,
    currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000),
    currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
    paymentCustomerId: fresh.customer as string,
    paymentSubscriptionId: fresh.id,
    paymentPriceId: subscriptionItem.price.id,
  });

  if (localSubscription.tier !== tierConfig.tier) {
    await syncRetentionToTier(localSubscription.userId, tierConfig.tier, eventId);
  }
}

async function syncRetentionToTier(userId: string, newTier: TierName, eventId: string): Promise<void> {
  const newMaxDays = getMaxRetentionDaysForTier(newTier);
  const graceUntil = addDays(new Date(), RETENTION_GRACE_DAYS);

  const result = await applyTierChangeToRetention(userId, newMaxDays, graceUntil);
  if (result.previousMaxRetention == null) return;

  const user = await findUserById(userId);
  if (!user?.email) {
    console.warn({ event: 'retention-clamp:email-skipped', reason: 'no-email', userId });
    return;
  }

  await enqueueEmail({
    type: 'data-retention-clamp',
    recipientKey: createUserRecipientKey(userId),
    campaignKey: `data-retention-clamp:${eventId}`,
    data: {
      to: user.email,
      userName: user.name,
      newPlanName: capitalizeFirstLetter(newTier),
      previousRetentionDays: result.previousMaxRetention,
      newRetentionDays: newMaxDays,
      graceUntil,
      upgradeUrl: `${env.PUBLIC_BASE_URL}/billing`,
    },
  });
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
