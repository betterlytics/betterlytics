'use client';

import { use, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { usePromo, usePromoLastDay } from '@/components/pricing/usePromo';
import { useBannerContext } from '@/contexts/BannerProvider';
import { useBillingFlow } from '@/contexts/BillingFlowProvider';
import { getUserBillingData } from '@/actions/billing.action';
import { baEvent } from '@/lib/ba-event';

interface PromoBannerProps {
  billingDataPromise: ReturnType<typeof getUserBillingData>;
}

export default function PromoBanner({ billingDataPromise }: PromoBannerProps) {
  const t = useTranslations('promo');
  const billingData = use(billingDataPromise);
  const promo = usePromo();
  const lastDay = usePromoLastDay(promo);
  const { addBanner, removeBanner, dismissBanner } = useBannerContext();
  const { openPlanPicker } = useBillingFlow();

  useEffect(() => {
    if (!promo || !billingData.success) return;
    const { isExistingPaidSubscriber, usage } = billingData.data;
    // accounts still setting up already see the verification and integration banners
    if (isExistingPaidSubscriber || usage.current === 0) return;

    addBanner({
      id: promo.id,
      level: 'info',
      dismissible: true,
      persistDismissal: true,
      scope: 'global',
      custom: (
        <div className='bg-muted/70 text-foreground/85 box-border flex w-full items-center gap-2.5 border-b px-3 py-1.5 text-xs sm:px-6'>
          <span className='bg-primary text-primary-foreground shrink-0 rounded px-2 text-[11.5px] leading-5 font-medium'>
            {t('barTag')}
          </span>
          <span className='min-w-0 flex-1 truncate'>
            <span className='sm:hidden'>{t('banner.short', { percent: promo.percentOff })}</span>
            <span className='max-sm:hidden'>
              {t('bar', { percent: promo.percentOff, months: promo.months, date: lastDay })}
            </span>
          </span>
          <button
            type='button'
            className='text-primary decoration-primary/45 hover:decoration-primary shrink-0 cursor-pointer font-medium whitespace-nowrap underline underline-offset-3'
            onClick={() => {
              baEvent('banner-action', { id: promo.id });
              openPlanPicker();
            }}
          >
            {t('banner.action')} →
          </button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => dismissBanner(promo.id)}
            className='hover:bg-accent/20 dark:hover:bg-accent/20 h-7 w-7 shrink-0 cursor-pointer rounded-md text-current hover:text-current'
            aria-label='Dismiss banner'
          >
            ✕
          </Button>
        </div>
      ),
    });

    return () => removeBanner(promo.id);
  }, [promo, billingData, lastDay, addBanner, removeBanner, dismissBanner, openPlanPicker, t]);

  return null;
}
