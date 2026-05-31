'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PricingComponent } from '@/components/pricing/PricingComponent';
import { useBillingFlow } from '@/contexts/BillingFlowProvider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SuccessCheckmark } from '@/components/billing/SuccessCheckmark';
import type { UserBillingData } from '@/entities/billing/billing.entities';

const SUCCESS_AUTO_CLOSE_MS = 2400;

interface BillingInteractiveProps {
  billingData: UserBillingData;
}

export function BillingInteractive({ billingData }: BillingInteractiveProps) {
  const t = useTranslations('components.billing.interactive');
  const tCheckout = useTranslations('components.billing.embeddedCheckout');
  const { selectPlan } = useBillingFlow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return;
    setShowSuccess(true);
    router.replace('/billing', { scroll: false });
    router.refresh();
    const timer = setTimeout(() => setShowSuccess(false), SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <>
      <PricingComponent
        onPlanSelect={selectPlan}
        billingData={billingData}
        defaultCurrency={billingData.subscription.currency ?? 'USD'}
        lockedCurrency={billingData.subscription.currencyLocked ? billingData.subscription.currency : undefined}
      />

      <div className='mt-6 text-center'>
        <p className='text-muted-foreground text-sm'>
          {billingData.isExistingPaidSubscriber ? t('subscriptionChangesNote') : t('freePlanNote')}
        </p>
      </div>

      <Dialog open={showSuccess} onOpenChange={(next) => !next && setShowSuccess(false)}>
        <DialogContent className='sm:max-w-md' overlayClassName='bg-white/85 dark:bg-black/85 backdrop-blur-sm'>
          <DialogHeader className='sr-only'>
            <DialogTitle>{tCheckout('successTitle')}</DialogTitle>
            <DialogDescription>
              {tCheckout('successDescription', { tier: billingData.subscription.tier })}
            </DialogDescription>
          </DialogHeader>
          <SuccessCheckmark
            label={tCheckout('successTitle')}
            description={tCheckout('successDescription', { tier: billingData.subscription.tier })}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
