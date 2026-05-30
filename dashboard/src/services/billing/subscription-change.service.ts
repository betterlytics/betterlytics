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

export async function applySubscriptionChange(
  userId: string,
  targetPlan: SelectedPlan,
  attemptId: string,
): Promise<void> {
  try {
    const { subscriptionId, itemId, newPrice } = await resolveSubscriptionContext(userId, targetPlan);

    // pending_if_incomplete: subscription only changes if the prorated invoice is paid.
    const updated = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [{ id: itemId, price: newPrice.id }],
        proration_behavior: PRORATION_BEHAVIOR,
        payment_behavior: 'pending_if_incomplete',
        cancel_at_period_end: false,
        metadata: {
          lookupKey: targetPlan.lookup_key ?? '',
        },
      },
      {
        idempotencyKey: `sub-update:${userId}:${attemptId}`,
      },
    );

    const succeeded =
      updated.pending_update === null && (updated.status === 'active' || updated.status === 'trialing');

    if (succeeded) {
      // Optimistic write so the user doesn't see a stale plan before the webhook lands.
      try {
        await syncSubscriptionFromStripe(updated, `optimistic:${updated.id}:${Date.now()}`);
      } catch (writeError) {
        // Payment succeeded; don't fail the user-facing request. Webhook reconciles.
        console.error('Optimistic subscription sync failed; relying on webhook:', writeError);
      }
      return;
    }

    const outcome = await resolvePaymentOutcome(updated.latest_invoice);
    if (outcome === 'authentication_required') {
      throw new UserException(
        'Please check your email to authenticate this payment and complete your upgrade.',
        'authentication_required',
      );
    }
    if (outcome === 'card_declined') {
      throw new UserException(
        'We could not charge your payment method. Please update your card and try again.',
        'card_declined',
      );
    }

    throw new UserException('Could not confirm the payment status. Please try again in a moment.');
  } catch (error) {
    if (error instanceof UserException) throw error;
    console.error('Failed to apply subscription change:', error);
    throw new UserException('Could not change plan. Please try again.');
  }
}

type PaymentOutcome = 'authentication_required' | 'card_declined' | 'unconfirmed';

async function resolvePaymentOutcome(
  latestInvoice: Stripe.Subscription['latest_invoice'],
): Promise<PaymentOutcome> {
  const invoiceId = typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id;
  if (!invoiceId) return 'unconfirmed';

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ['payments.data.payment.payment_intent'],
    });

    const paymentIntent = (invoice.payments?.data ?? [])
      .map((invoicePayment) => invoicePayment.payment.payment_intent)
      .find((intent): intent is Stripe.PaymentIntent => intent != null && typeof intent !== 'string');

    switch (paymentIntent?.status) {
      case 'requires_action':
        return 'authentication_required';
      case 'requires_payment_method':
        return 'card_declined';
      default:
        return 'unconfirmed';
    }
  } catch (error) {
    console.warn('Could not determine subscription payment outcome:', error);
    return 'unconfirmed';
  }
}
