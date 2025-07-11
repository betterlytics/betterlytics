'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { stripe } from '@/lib/billing/stripe';
import { SelectedPlan, SelectedPlanSchema } from '@/types/pricing';
import { User } from 'next-auth';
import { env } from '@/lib/env';
import { getUserSubscription } from '@/repositories/postgres/subscription';
import { Stripe } from 'stripe';

async function getPriceByLookupKey(lookupKey: string): Promise<Stripe.Price> {
  try {
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      expand: ['data.currency_options'],
    });

    if (prices.data.length === 0) {
      throw new Error(`No price found for lookup key: ${lookupKey}`);
    }

    return prices.data[0];
  } catch (error) {
    console.error('Error retrieving price from lookup key:', error);
    throw new Error(`Failed to retrieve price for lookup key: ${lookupKey}`);
  }
}

export const createStripeCheckoutSession = withUserAuth(async (user: User, planData: SelectedPlan) => {
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

    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      currency: validatedPlan.currency.toLowerCase(),
      customer_email: user.email,
      metadata: {
        userId: user.id,
        lookupKey: validatedPlan.lookup_key,
        requestedCurrency: validatedPlan.currency,
        isInitialSubscription: 'true',
      },
      success_url: `${env.NEXT_PUBLIC_BASE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/billing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      /*automatic_tax: {
        enabled: true,
      },
      */
    });

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return checkoutSession.url;
  } catch (error) {
    console.error('Failed to create Stripe checkout session:', error);
    throw new Error('Failed to create checkout session. Please try again.');
  }
});

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
      return_url: `${env.NEXT_PUBLIC_BASE_URL}/billing`,
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
    throw new Error('Failed to access billing portal. Please try again.');
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
      return_url: `${env.NEXT_PUBLIC_BASE_URL}/billing`,
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
    throw new Error('Failed to access billing portal. Please try again.');
  }
});
