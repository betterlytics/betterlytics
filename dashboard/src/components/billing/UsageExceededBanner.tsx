'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import { useNotificationsContext } from '@/contexts/NotificationProvider';
import { getUserBillingData } from '@/actions/billing';

interface UsageExceededBannerProps {
  billingDataPromise: ReturnType<typeof getUserBillingData>;
}

export default function UsageExceededBanner({ billingDataPromise }: UsageExceededBannerProps) {
  const t = useTranslations('banners.usageLimitExceeded');
  const billingData = use(billingDataPromise);
  const { addNotification, removeNotification } = useNotificationsContext();

  useEffect(() => {
    if (!billingData.success) {
      removeNotification('usage-exceeded-banner');
      return;
    }

    const { usage } = billingData.data;

    if (!usage.isOverLimit) {
      removeNotification('usage-exceeded-banner');
      return;
    }

    const overagePercentage = (usage.current / usage.limit) * 100;

    addNotification({
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
      dismissible: true,
      scope: 'global',
      sticky: true,
    });

    return () => removeNotification('usage-exceeded-banner');
  }, [billingData, addNotification, removeNotification, t]);

  return null;
}
