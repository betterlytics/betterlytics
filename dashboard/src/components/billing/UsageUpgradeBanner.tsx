'use client';

import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';
import type { UserBillingData } from '@/entities/billing';
import { formatPercentage } from '@/utils/formatters';
import { ServerActionResponse } from '@/middlewares/serverActionHandler';
import { useTranslations } from 'next-intl';

interface UsageUpgradeBannerProps {
  billingDataPromise: Promise<ServerActionResponse<UserBillingData>>;
}

export default function UsageUpgradeBanner({ billingDataPromise }: UsageUpgradeBannerProps) {
  const t = useTranslations('components.billing.usageBanner');
  const billingData = use(billingDataPromise);

  if (!billingData.success) {
    return null;
  }

  const { usage, subscription } = billingData.data;

  if (!usage.isOverLimit) {
    return null;
  }

  const overageEvents = usage.current - usage.limit;
  const overagePercentage = (overageEvents / usage.limit) * 100;

  return (
    <div className='w-full border-b border-red-600 bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'>
      <div className='container mx-auto px-4 py-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <AlertTriangle className='h-4 w-4 flex-shrink-0' />
            <div className='flex flex-col text-sm sm:flex-row sm:items-center sm:gap-2'>
              <span className='font-medium'>{t('title')}</span>
              <span>
                {t.rich('body', {
                  current: usage.current.toLocaleString(),
                  limit: usage.limit.toLocaleString(),
                  percentage: formatPercentage(overagePercentage),
                  plan: subscription.tier,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
              <span className='flex items-center gap-1 font-medium text-yellow-200'>
                <AlertCircle className='h-3 w-3' />
                {t('upgradeHint')}
              </span>
            </div>
          </div>
          <div className='flex items-center'>
            <Button
              asChild
              size='sm'
              className='h-7 cursor-pointer bg-white/80 px-4 py-1 text-xs font-semibold text-red-600 shadow-sm hover:bg-gray-100'
            >
              <Link href='/billing'>{t('upgradeCta')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
