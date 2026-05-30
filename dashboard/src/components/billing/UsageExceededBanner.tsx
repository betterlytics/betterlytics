'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { use } from 'react';
import { formatPercentage } from '@/utils/formatters';
import { useLocale, useTranslations } from 'next-intl';
import { useBannerContext } from '@/contexts/BannerProvider';
import { useBillingFlow } from '@/contexts/BillingFlowProvider';
import { getUserBillingData } from '@/actions/billing.action';

interface UsageExceededBannerProps {
  billingDataPromise: ReturnType<typeof getUserBillingData>;
}

export default function UsageExceededBanner({ billingDataPromise }: UsageExceededBannerProps) {
  const t = useTranslations('banners.usageLimitExceeded');
  const locale = useLocale();
  const billingData = use(billingDataPromise);
  const { addBanner, removeBanner } = useBannerContext();
  const { openPlanPicker } = useBillingFlow();

  useEffect(() => {
    if (!billingData.success) {
      removeBanner('usage-exceeded-banner');
      return;
    }

    const { usage } = billingData.data;

    if (usage.usagePercentage < 100 || !usage.isOverLimit) {
      removeBanner('usage-exceeded-banner');
      return;
    }

    const overagePercentage = (usage.current / usage.limit) * 100;

    addBanner({
      id: 'usage-exceeded-banner',
      level: 'error',
      title: t('title'),
      description: t('description', {
        percentage: formatPercentage(overagePercentage, locale),
        current: usage.current.toLocaleString(locale),
        limit: usage.limit.toLocaleString(locale),
      }),
      action: (
        <Button
          variant='default'
          onClick={openPlanPicker}
          className='text-primary-foreground cursor-pointer border-1 border-white bg-red-500 shadow-md hover:bg-red-400'
          size='sm'
        >
          {t('action')}
        </Button>
      ),
      dismissible: false,
      scope: 'global',
      sticky: true,
    });

    return () => removeBanner('usage-exceeded-banner');
  }, [billingData, addBanner, removeBanner, openPlanPicker, t, locale]);

  return null;
}
