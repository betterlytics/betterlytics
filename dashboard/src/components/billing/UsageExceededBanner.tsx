'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import { useBannerContext } from '@/contexts/BannerProvider';
import { getUserBillingData } from '@/actions/billing';

interface UsageExceededBannerProps {
  billingDataPromise: ReturnType<typeof getUserBillingData>;
}

export default function UsageExceededBanner({ billingDataPromise }: UsageExceededBannerProps) {
  const t = useTranslations('banners.usageLimitExceeded');
  const billingData = use(billingDataPromise);
  const { addBanner, removeBanner } = useBannerContext();

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
        percentage: formatPercentage(overagePercentage),
        current: usage.current.toLocaleString(),
        limit: usage.limit.toLocaleString(),
      }),
      action: (
        <Button
          asChild
          variant='default'
          className='text-primary-foreground cursor-pointer border-1 border-white bg-red-500 shadow-md hover:bg-red-400'
          size='sm'
        >
          <Link href='/billing'>{t('action')}</Link>
        </Button>
      ),
      dismissible: false,
      scope: 'global',
      sticky: true,
    });

    return () => removeBanner('usage-exceeded-banner');
  }, [billingData, addBanner, removeBanner, t]);

  return null;
}
