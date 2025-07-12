'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { PricingComponent } from '@/components/pricing/PricingComponent';
import { SelectedPlan, SelectedPlanSchema } from '@/types/pricing';
import { createStripeCheckoutSession, createStripeCustomerPortalSession } from '@/actions/stripe';
import type { UserBillingData } from '@/entities/billing';
import { VerificationRequiredModal } from '@/components/accountVerification/VerificationRequiredModal';

interface BillingInteractiveProps {
  billingData: UserBillingData;
}

export function BillingInteractive({ billingData }: BillingInteractiveProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    if (searchParams?.get('canceled') === 'true') {
      toast.info('Checkout was canceled. You can try again anytime.');
    }
  }, [searchParams]);

  const handlePlanSelect = async (planData: SelectedPlan) => {
    try {
      const validatedPlan = SelectedPlanSchema.parse(planData);

      if (validatedPlan.tier === 'enterprise') {
        toast.info('Please contact us for a custom plan');
        return;
      }

      if (!session?.user?.emailVerified) {
        setShowVerificationModal(true);
        return;
      }

      if (billingData.isExistingPaidSubscriber) {
        const portalUrl = await createStripeCustomerPortalSession(validatedPlan);
        if (portalUrl) {
          window.location.href = portalUrl;
        } else {
          throw new Error('No customer portal URL received');
        }
        return;
      }

      const result = await createStripeCheckoutSession(validatedPlan);
      if (result) {
        window.location.href = result;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch {
      toast.error('Failed to process plan selection, please try again.');
    }
  };

  return (
    <>
      <PricingComponent onPlanSelect={handlePlanSelect} billingData={billingData} defaultCurrency={'USD'} />

      <div className='mt-6 text-center'>
        {billingData.isExistingPaidSubscriber ? (
          <p className='text-muted-foreground text-sm'>
            Changes to your subscription will be processed immediately through Stripe's secure billing portal.
          </p>
        ) : (
          <p className='text-muted-foreground text-sm'>Start with our free plan - no credit card required.</p>
        )}
      </div>

      {session?.user?.email && (
        <VerificationRequiredModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userEmail={session.user.email}
          userName={session.user.name || undefined}
        />
      )}
    </>
  );
}
