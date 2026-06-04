import 'server-only';

import type { Stripe } from 'stripe';
import { stripe } from '@/lib/billing/stripe';
import { getUserSubscription } from '@/repositories/postgres/subscription.repository';
import {
  SubscriptionChangePreviewSchema,
  type SubscriptionChangePreview,
} from '@/entities/billing/billing.entities';
import type { SelectedPlan } from '@/types/pricing';
import { UserException } from '@/lib/exceptions';
import { syncSubscriptionFromStripe } from '@/services/system/webhookHandlers.service';
import { findActivePriceByLookupKey } from '@/lib/billing/stripe-prices';
import { clearScheduledCancellation } from '@/services/billing/subscription.service';

function isProrationLine(line: Stripe.InvoiceLineItem): boolean {
  const parent = line.parent;
  if (!parent) return false;
  return Boolean(parent.subscription_item_details?.proration || parent.invoice_item_details?.proration);
}

const PRORATION_BEHAVIOR = 'always_invoice' as const;

function priceAmountForCurrency(price: Stripe.Price, currencyLower: string): number {
  if (price.currency === currencyLower) {
    if (price.unit_amount == null) {
      throw new Error(`Price ${price.id} has no unit_amount in ${currencyLower}`);
    }
    return price.unit_amount;
  }
  const amount = price.currency_options?.[currencyLower]?.unit_amount;
  if (amount == null) {
    throw new Error(`Price ${price.id} has no amount in ${currencyLower}`);
  }
  return amount;
}

async function resolvePrice(lookupKey: string): Promise<Stripe.Price> {
  const price = await findActivePriceByLookupKey(lookupKey);
  if (!price) {
    throw new UserException('Selected plan is not available.');
  }
  return price;
}

async function resolveSubscriptionContext(userId: string, targetPlan: SelectedPlan) {
  if (!targetPlan.lookup_key) {
    throw new UserException('Selected plan is not available.');
  }

  const localSubscription = await getUserSubscription(userId);
  if (!localSubscription?.paymentSubscriptionId) {
    throw new UserException('You do not have an active subscription to change.');
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(localSubscription.paymentSubscriptionId);

  if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
    throw new UserException('You do not have an active subscription to change.');
  }

  const currentItem = stripeSubscription.items.data[0];
  if (!currentItem) {
    throw new UserException('Subscription is missing a line item.');
  }

  const newPrice = await resolvePrice(targetPlan.lookup_key);

  const subCurrency = stripeSubscription.currency;
  const priceSupportsSubCurrency =
    newPrice.currency === subCurrency || Boolean(newPrice.currency_options?.[subCurrency]);
  if (!priceSupportsSubCurrency) {
    throw new UserException('This plan is not available in your billing currency. Contact support.');
  }

  const isSamePlan =
    currentItem.price.id === newPrice.id ||
    (!!currentItem.price.lookup_key && currentItem.price.lookup_key === newPrice.lookup_key);
  if (isSamePlan) {
    throw new UserException('You are already on this plan.');
  }

  return {
    subscriptionId: localSubscription.paymentSubscriptionId,
    customerId: stripeSubscription.customer as string,
    itemId: currentItem.id,
    currentPeriodEnd: currentItem.current_period_end,
    newPrice,
  };
}

export async function previewSubscriptionChange(
  userId: string,
  targetPlan: SelectedPlan,
): Promise<SubscriptionChangePreview> {
  try {
    const { subscriptionId, itemId, currentPeriodEnd, newPrice } = await resolveSubscriptionContext(
      userId,
      targetPlan,
    );

    const preview = await stripe.invoices.createPreview({
      subscription: subscriptionId,
      subscription_details: {
        items: [{ id: itemId, price: newPrice.id }],
        proration_behavior: PRORATION_BEHAVIOR,
        cancel_at_period_end: false,
      },
    });

    const proratedSubtotal = preview.lines.data
      .filter(isProrationLine)
      .reduce((sum, line) => sum + line.amount, 0);

    return SubscriptionChangePreviewSchema.parse({
      amountDue: preview.amount_due,
      currency: preview.currency.toUpperCase(),
      nextRenewalAmount: priceAmountForCurrency(newPrice, preview.currency),
      nextRenewalDate: new Date(currentPeriodEnd * 1000),
      appliedBalance: Math.max(0, proratedSubtotal - preview.amount_due),
      lines: preview.lines.data.map((line) => ({
        description: line.description,
        amount: line.amount,
        proration: isProrationLine(line),
      })),
    });
  } catch (error) {
    if (error instanceof UserException) throw error;
    console.error('Failed to preview subscription change:', error);
    throw new UserException('Could not preview plan change. Please try again.');
  }
}

export type ApplyChangeResult =
  | { status: 'succeeded' }
  | { status: 'requires_action'; clientSecret: string };

export async function applySubscriptionChange(
  userId: string,
  targetPlan: SelectedPlan,
  attemptId: string,
): Promise<ApplyChangeResult> {
  try {
    const { subscriptionId, itemId, newPrice } = await resolveSubscriptionContext(userId, targetPlan);

    const updated = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [{ id: itemId, price: newPrice.id }],
        proration_behavior: PRORATION_BEHAVIOR,
        payment_behavior: 'pending_if_incomplete',
        metadata: {
          lookupKey: targetPlan.lookup_key ?? '',
        },
      },
      {
        idempotencyKey: `sub-update:${userId}:${attemptId}`,
      },
    );

    if (isSubscriptionPaid(updated)) {
      await persistPaidSubscription(updated);
      return { status: 'succeeded' };
    }

    return resolveIncompleteOutcome(updated.latest_invoice);
  } catch (error) {
    if (error instanceof UserException) throw error;
    console.error('Failed to apply subscription change:', error);
    throw new UserException('Could not change plan. Please try again.');
  }
}

export async function syncSubscriptionChangeStatus(userId: string): Promise<ApplyChangeResult> {
  try {
    const localSubscription = await getUserSubscription(userId);
    if (!localSubscription?.paymentSubscriptionId) {
      throw new UserException('You do not have an active subscription to change.');
    }

    const subscription = await stripe.subscriptions.retrieve(localSubscription.paymentSubscriptionId);

    if (isSubscriptionPaid(subscription)) {
      await persistPaidSubscription(subscription);
      return { status: 'succeeded' };
    }

    return resolveIncompleteOutcome(subscription.latest_invoice);
  } catch (error) {
    if (error instanceof UserException) throw error;
    console.error('Failed to sync subscription change status:', error);
    throw new UserException('Could not confirm the payment status. Please try again in a moment.');
  }
}

function isSubscriptionPaid(sub: Stripe.Subscription): boolean {
  return sub.pending_update === null && (sub.status === 'active' || sub.status === 'trialing');
}

async function persistPaidSubscription(sub: Stripe.Subscription): Promise<void> {
  const finalSub = await clearScheduledCancellation(sub);

  try {
    await syncSubscriptionFromStripe(finalSub, `optimistic:${finalSub.id}:${Date.now()}`);
  } catch (writeError) {
    console.error('Optimistic subscription sync failed; relying on webhook:', writeError);
  }
}

async function resolveIncompleteOutcome(
  latestInvoice: Stripe.Subscription['latest_invoice'],
): Promise<ApplyChangeResult> {
  const outcome = await resolvePaymentOutcome(latestInvoice);

  if (outcome.kind === 'succeeded') {
    return { status: 'succeeded' };
  }
  if (outcome.kind === 'authentication_required') {
    return { status: 'requires_action', clientSecret: outcome.clientSecret };
  }
  if (outcome.kind === 'card_declined') {
    throw new UserException(
      'We could not charge your payment method. Please update your card and try again.',
      'card_declined',
    );
  }

  throw new UserException('Could not confirm the payment status. Please try again in a moment.');
}

type PaymentOutcome =
  | { kind: 'succeeded' }
  | { kind: 'authentication_required'; clientSecret: string }
  | { kind: 'card_declined' }
  | { kind: 'unconfirmed' };

async function resolvePaymentOutcome(
  latestInvoice: Stripe.Subscription['latest_invoice'],
): Promise<PaymentOutcome> {
  const invoiceId = typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id;
  if (!invoiceId) return { kind: 'unconfirmed' };

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ['payments.data.payment.payment_intent'],
    });

    const paymentIntent = (invoice.payments?.data ?? [])
      .map((invoicePayment) => invoicePayment.payment.payment_intent)
      .find((intent): intent is Stripe.PaymentIntent => intent != null && typeof intent !== 'string');

    switch (paymentIntent?.status) {
      case 'succeeded':
      case 'processing':
        return { kind: 'succeeded' };
      case 'requires_action':
        return paymentIntent.client_secret
          ? { kind: 'authentication_required', clientSecret: paymentIntent.client_secret }
          : { kind: 'unconfirmed' };
      case 'requires_payment_method':
        return { kind: 'card_declined' };
      default:
        return { kind: 'unconfirmed' };
    }
  } catch (error) {
    console.warn('Could not determine subscription payment outcome:', error);
    return { kind: 'unconfirmed' };
  }
}
