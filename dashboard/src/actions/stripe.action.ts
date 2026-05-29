'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { stripe } from '@/lib/billing/stripe';
import { SelectedPlan, SelectedPlanSchema } from '@/types/pricing';
import { User } from 'next-auth';
import { env } from '@/lib/env';
import { getUserSubscription } from '@/repositories/postgres/subscription.repository';
import { getOrCreateStripeCustomer, getLockedCustomerCurrency } from '@/services/billing/customer.service';
import { Stripe } from 'stripe';
import { UserException } from '@/lib/exceptions';
import type { Currency } from '@/entities/billing/billing.entities';
import { findActivePriceByLookupKey } from '@/lib/billing/stripe-prices';

async function getPriceByLookupKey(lookupKey: string): Promise<Stripe.Price> {
  try {
    const price = await findActivePriceByLookupKey(lookupKey);
    if (!price) {
      throw new Error(`No price found for lookup key: ${lookupKey}`);
    }
    return price;
  } catch (error) {
    console.error('Error retrieving price from lookup key:', error);
    throw new Error(`Failed to retrieve price for lookup key: ${lookupKey}`);
  }
}

const LIVE_SUBSCRIPTION_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due', 'unpaid'];

async function hasLiveSubscription(customerId: string): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  });
  return subscriptions.data.some((subscription) => LIVE_SUBSCRIPTION_STATUSES.includes(subscription.status));
}

export type EmbeddedCheckoutSession = {
  clientSecret: string;
  sessionId: string;
};

export const createStripeCheckoutSession = withUserAuth(
  async (user: User, planData: SelectedPlan): Promise<EmbeddedCheckoutSession> => {
    try {
      const validatedPlan = SelectedPlanSchema.parse(planData);

      if (!user.emailVerified) {
        throw new Error('Attempting to purchase with unverified email.');
      }

      if (validatedPlan.price_cents === 0 && validatedPlan.tier === 'growth') {
        throw new Error('Free plans do not require checkout');
      }

      if (validatedPlan.tier === 'enterprise') {
        throw new Error('Custom plans require manual setup');
      }

      if (!validatedPlan.lookup_key) {
        throw new Error('No lookup key provided for plan');
      }

      const price = await getPriceByLookupKey(validatedPlan.lookup_key);
      const customerId = await getOrCreateStripeCustomer(user);

      if (await hasLiveSubscription(customerId)) {
        throw new UserException('You already have an active subscription. Refresh the page to change your plan.');
      }

      const lockedCurrency = await getLockedCustomerCurrency(customerId);
      const effectiveCurrency = (lockedCurrency?.toUpperCase() ?? validatedPlan.currency) as Currency;
      const effectiveCurrencyLower = effectiveCurrency.toLowerCase();

      if (price.currency !== effectiveCurrencyLower && !price.currency_options?.[effectiveCurrencyLower]) {
        throw new UserException(`This plan is not available in ${effectiveCurrency}. Please contact support.`);
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        ui_mode: 'embedded_page',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        currency: effectiveCurrencyLower,
        customer: customerId,
        metadata: {
          userId: user.id,
          lookupKey: validatedPlan.lookup_key,
          requestedCurrency: validatedPlan.currency,
          effectiveCurrency,
          isInitialSubscription: 'true',
        },
        return_url: `${env.PUBLIC_BASE_URL}/billing?checkout=success`,
        redirect_on_completion: 'if_required',
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        locale: 'auto',
      });

      if (!checkoutSession.client_secret) {
        throw new Error('Failed to create checkout session client secret');
      }

      return {
        clientSecret: checkoutSession.client_secret,
        sessionId: checkoutSession.id,
      };
    } catch (error) {
      if (error instanceof UserException) throw error;
      console.error('Failed to create Stripe checkout session:', error);
      throw new UserException('Failed to create checkout session. Please try again.');
    }
  },
);

export const createStripeCustomerPortalSessionForCancellation = withUserAuth(async (user: User) => {
  try {
    if (!user.emailVerified) {
      throw new Error('Attempting to create customer portal session for cancellation with unverified email.');
    }

    const subscription = await getUserSubscription(user.id);

    if (!subscription?.paymentCustomerId) {
      throw new Error('No Stripe customer found for this user');
    }

    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Cancel your subscription',
      },
      features: {
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other'],
          },
        },
        payment_method_update: { enabled: true },
        invoice_history: { enabled: true },
        subscription_update: { enabled: false },
      },
    });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.paymentCustomerId,
      return_url: `${env.PUBLIC_BASE_URL}/billing`,
      configuration: configuration.id,
      flow_data: {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: subscription.paymentSubscriptionId!,
        },
      },
    });

    if (!portalSession.url) {
      throw new Error('Failed to create customer portal session URL');
    }

    return portalSession.url;
  } catch (error) {
    console.error('Failed to create Stripe customer portal session for cancellation:', error);
    throw new UserException('Failed to access billing portal. Please try again.');
  }
});

export const createStripeCustomerPortalSession = withUserAuth(async (user: User, targetPlan?: SelectedPlan) => {
  try {
    if (!user.emailVerified) {
      throw new Error('Attempting to create customer portal session with unverified email.');
    }

    const subscription = await getUserSubscription(user.id);

    if (!subscription?.paymentCustomerId) {
      throw new Error('No Stripe customer found for this user');
    }

    let configurationId: string | undefined;

    if (targetPlan?.lookup_key) {
      try {
        const targetPrice = await getPriceByLookupKey(targetPlan.lookup_key);

        const configuration = await stripe.billingPortal.configurations.create({
          business_profile: {
            headline: `Switching to ${targetPlan.tier} plan with ${targetPlan.eventLimit.toLocaleString()} events`,
          },
          features: {
            subscription_update: {
              enabled: true,
              default_allowed_updates: ['price', 'promotion_code'],
              proration_behavior: 'always_invoice',
              products: [
                {
                  product: targetPrice.product as string,
                  prices: [targetPrice.id],
                },
              ],
            },
            payment_method_update: { enabled: true },
            invoice_history: { enabled: true },
            subscription_cancel: { enabled: true },
          },
        });

        configurationId = configuration.id;
      } catch (configError) {
        console.warn('Failed to create custom configuration, using default:', configError);
        // Fallback to default configuration
      }
    }

    const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: subscription.paymentCustomerId,
      return_url: `${env.PUBLIC_BASE_URL}/billing`,
    };

    if (configurationId) {
      sessionParams.configuration = configurationId;
    }

    if (targetPlan && subscription.paymentSubscriptionId) {
      sessionParams.flow_data = {
        type: 'subscription_update',
        subscription_update: {
          subscription: subscription.paymentSubscriptionId,
        },
      };
    }

    const portalSession = await stripe.billingPortal.sessions.create(sessionParams);

    if (!portalSession.url) {
      throw new Error('Failed to create customer portal session URL');
    }

    return portalSession.url;
  } catch (error) {
    console.error('Failed to create Stripe customer portal session:', error);
    throw new UserException('Failed to access billing portal. Please try again.');
  }
});
