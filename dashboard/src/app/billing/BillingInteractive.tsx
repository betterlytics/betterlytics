'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PricingComponent } from '@/components/pricing/PricingComponent';
import { SelectedPlan, SelectedPlanSchema } from '@/types/pricing';
import { createStripeCheckoutSession } from '@/actions/stripe';
import type { UserBillingData } from '@/entities/billing';

interface BillingInteractiveProps {
  billingData: UserBillingData;
}

export function BillingInteractive({ billingData }: BillingInteractiveProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get('canceled') === 'true') {
      toast.info('Checkout was canceled. You can try again anytime.');
    }
  }, [searchParams]);

  const handlePlanSelect = async (planData: SelectedPlan) => {
    try {
      const validatedPlan = SelectedPlanSchema.parse(planData);

      if (validatedPlan.price === 0 && validatedPlan.tier === 'growth') {
        if (billingData.isExistingPaidSubscriber) {
          // TODO: Handle downgrade to free plan (implement later?)
          return;
        } else {
          toast.info('You are already on the free starter plan!');
          return;
        }
      }

      if (validatedPlan.tier === 'enterprise') {
        toast.info('Please contact us for custom pricing');
        return;
      }

      if (billingData.isExistingPaidSubscriber) {
        // TODO: Handle plan change for existing subscribers (implement later)
        return;
      } else {
        const result = await createStripeCheckoutSession(validatedPlan);

        if (result) {
          window.location.href = result;
        } else {
          throw new Error('No checkout URL received');
        }
      }
    } catch {
      toast.error('Failed to process plan selection, please try again.');
    }
  };

  return (
    <>
      <PricingComponent onPlanSelect={handlePlanSelect} billingData={billingData} />
      <div className='mt-6 text-center'>
        <p className='text-muted-foreground text-sm'>Start with our free plan - no credit card required.</p>
      </div>
    </>
  );
}
