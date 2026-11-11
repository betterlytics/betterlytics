'use client';

import { use, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { usePromo, usePromoLastDay } from '@/components/pricing/usePromo';
import { useBannerContext } from '@/contexts/BannerProvider';
import { useBillingFlow } from '@/contexts/BillingFlowProvider';
import { getUserBillingData } from '@/actions/billing.action';

interface PromoBannerProps {
  billingDataPromise: ReturnType<typeof getUserBillingData>;
}

export default function PromoBanner({ billingDataPromise }: PromoBannerProps) {
  const t = useTranslations('promo.banner');
  const billingData = use(billingDataPromise);
  const promo = usePromo();
  const lastDay = usePromoLastDay(promo);
  const { addBanner, removeBanner } = useBannerContext();
  const { openPlanPicker } = useBillingFlow();

  useEffect(() => {
    if (!promo || !billingData.success || billingData.data.isExistingPaidSubscriber) return;

    addBanner({
      id: promo.id,
      level: 'info',
      title: t('title'),
      description: t('description', { percent: promo.percentOff, months: promo.months, date: lastDay }),
      action: (
        <Button
          variant='default'
          onClick={() => openPlanPicker()}
          className='bg-primary text-primary-foreground hover:bg-primary/40 cursor-pointer border-1 border-white shadow-md'
          size='sm'
        >
          {t('action')}
        </Button>
      ),
      dismissible: true,
      persistDismissal: true,
      scope: 'global',
    });

    return () => removeBanner(promo.id);
  }, [promo, billingData, lastDay, addBanner, removeBanner, openPlanPicker, t]);

  return null;
}
