'use client';

import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use } from 'react';
import type { UserBillingData } from '@/entities/billing';
import { formatPercentage } from '@/utils/formatters';
import { ServerActionResponse } from '@/middlewares/serverActionHandler';

interface UsageUpgradeBannerProps {
  billingDataPromise: Promise<ServerActionResponse<UserBillingData>>;
}

export default function UsageUpgradeBanner({ billingDataPromise }: UsageUpgradeBannerProps) {
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
              <span className='font-medium'>Usage Limit Exceeded:</span>
              <span>
                You&apos;ve used <strong>{usage.current.toLocaleString()}</strong> events out of your{' '}
                <strong>{usage.limit.toLocaleString()}</strong> event limit ({formatPercentage(overagePercentage)}{' '}
                over your {subscription.tier} plan).
              </span>
              <span className='flex items-center gap-1 font-medium text-yellow-200'>
                <AlertCircle className='h-3 w-3' />
                Upgrade to ensure all your analytics data remains accessible
              </span>
            </div>
          </div>
          <div className='flex items-center'>
            <Button
              asChild
              size='sm'
              className='h-7 bg-white/80 px-4 py-1 text-xs font-semibold text-red-600 shadow-sm hover:bg-gray-100'
            >
              <Link href='/billing'>Upgrade Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
