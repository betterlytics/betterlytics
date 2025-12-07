'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import { useBannerContext } from '@/contexts/BannerProvider';
import { getUserBillingData } from '@/actions/billing.action';

interface UsageAlertBannerProps {
  billingDataPromise: ReturnType<typeof getUserBillingData>;
}

export default function UsageAlertBanner({ billingDataPromise }: UsageAlertBannerProps) {
  const t = useTranslations('banners.usageAlert');
  const billingData = use(billingDataPromise);
  const { addBanner, removeBanner } = useBannerContext();

  useEffect(() => {
    if (!billingData.success) {
      removeBanner('usage-alert-banner');
      return;
    }

    const { usage } = billingData.data;

    if (usage.usagePercentage < 80 || usage.usagePercentage >= 100 || usage.isOverLimit) {
      removeBanner('usage-alert-banner');
      return;
    }

    addBanner({
      id: 'usage-alert-banner',
      level: 'warning',
      title: t('title'),
      description: t.rich('description', {
        percentage: formatPercentage(usage.usagePercentage),
        current: usage.current.toLocaleString(),
        limit: usage.limit.toLocaleString(),
        strong: (chunks) => <strong>{chunks}</strong>,
      }),
      action: (
        <Button
          asChild
          variant='default'
          className='text-primary-foreground cursor-pointer border-1 border-white bg-amber-600/50 shadow-md hover:bg-amber-600/20'
          size='sm'
        >
          <Link href='/billing'>{t('action')}</Link>
        </Button>
      ),
      dismissible: true,
      scope: 'global',
      sticky: true,
    });

    return () => removeBanner('usage-alert-banner');
  }, [addBanner, removeBanner, t]);

  return null;
}
