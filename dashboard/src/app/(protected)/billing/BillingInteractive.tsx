'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { PricingComponent } from '@/components/pricing/PricingComponent';
import { SelectedPlan, SelectedPlanSchema } from '@/types/pricing';
import { createStripeCheckoutSession, createStripeCustomerPortalSession } from '@/actions/stripe';
import type { UserBillingData } from '@/entities/billing/billing';
import { VerificationRequiredModal } from '@/components/accountVerification/VerificationRequiredModal';
import { useTranslations } from 'next-intl';

interface BillingInteractiveProps {
  billingData: UserBillingData;
}

export function BillingInteractive({ billingData }: BillingInteractiveProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const t = useTranslations('components.billing.interactive');

  useEffect(() => {
    if (searchParams?.get('canceled') === 'true') {
      toast.info(t('checkoutCanceled'));
    }
  }, [searchParams]);

  const handlePlanSelect = async (planData: SelectedPlan) => {
    try {
      const validatedPlan = SelectedPlanSchema.parse(planData);

      if (validatedPlan.tier === 'enterprise') {
        toast.info(t('contactForCustomPlan'));
        return;
      }

      if (!session?.user?.emailVerified) {
        setShowVerificationModal(true);
        return;
      }

      if (billingData.isExistingPaidSubscriber) {
        const portalUrl = await createStripeCustomerPortalSession(validatedPlan);
        if (portalUrl.success) {
          window.location.href = portalUrl.data;
        } else {
          throw new Error('NO_PORTAL_URL');
        }
        return;
      }

      const result = await createStripeCheckoutSession(validatedPlan);
      if (result.success) {
        window.location.href = result.data;
      } else {
        throw new Error('NO_CHECKOUT_URL');
      }
    } catch {
      toast.error(t('planSelectionFailed'));
    }
  };

  return (
    <>
      <PricingComponent onPlanSelect={handlePlanSelect} billingData={billingData} defaultCurrency={'USD'} />

      <div className='mt-6 text-center'>
        {billingData.isExistingPaidSubscriber ? (
          <p className='text-muted-foreground text-sm'>{t('subscriptionChangesNote')}</p>
        ) : (
          <p className='text-muted-foreground text-sm'>{t('freePlanNote')}</p>
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
