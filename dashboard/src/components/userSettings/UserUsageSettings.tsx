'use client';

import { useBARouter } from '@/hooks/use-ba-router';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillingData } from '@/hooks/useBillingData';
import { useTranslations } from 'next-intl';

interface UserUsageSettingsProps {
  onCloseDialog?: () => void;
}

export default function UserUsageSettings({ onCloseDialog }: UserUsageSettingsProps) {
  const router = useBARouter();
  const { billingData, isLoading, error } = useBillingData();
  const t = useTranslations('components.userSettings.usage');

  const handleViewPlans = () => {
    onCloseDialog?.();
    router.push('/billing');
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <div className='h-5 w-40'>
            <Skeleton className='h-5 w-40' />
          </div>
          <div className='mt-2 h-4 w-72'>
            <Skeleton className='h-4 w-72' />
          </div>
        </div>

        <div className='bg-card rounded-lg border p-4'>
          <div className='h-6 w-48'>
            <Skeleton className='h-6 w-48' />
          </div>
          <div className='mt-2 h-4 w-64'>
            <Skeleton className='h-4 w-64' />
          </div>
          <div className='mt-4 h-32 w-full'>
            <Skeleton className='h-32 w-full' />
          </div>
        </div>

        <div className='bg-card flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='space-y-1'>
            <div className='h-4 w-40'>
              <Skeleton className='h-4 w-40' />
            </div>
            <div className='h-4 w-64'>
              <Skeleton className='h-4 w-64' />
            </div>
          </div>
          <div className='h-9 w-28'>
            <Skeleton className='h-9 w-28' />
          </div>
        </div>
      </div>
    );
  }

  if (error || !billingData) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground'>{t('error')}</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>{t('title')}</h3>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      <CurrentPlanCard billingData={billingData} showManagementButtons={true} />

      <div className='bg-card flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1'>
          <h4 className='flex items-center gap-2 text-sm font-medium'>
            <Zap className='text-primary h-4 w-4' />
            {t('cta.needMore')}
          </h4>
          <p className='text-muted-foreground text-sm'>{t('cta.upgradeHint')}</p>
        </div>
        <Button onClick={handleViewPlans} size='sm' className='cursor-pointer'>
          {t('cta.viewPlans')}
        </Button>
      </div>

      {billingData.usage.isOverLimit && (
        <div className='border-destructive/20 bg-destructive/5 rounded-lg border p-4'>
          <div className='flex items-start gap-3'>
            <div className='bg-destructive/10 rounded-full p-1'>
              <Zap className='text-destructive h-4 w-4' />
            </div>
            <div className='space-y-1'>
              <h4 className='text-destructive text-sm font-medium'>Usage limit exceeded</h4>
              <p className='text-destructive/80 text-sm'>
                You&apos;ve exceeded your monthly event limit. Upgrade your plan to continue tracking all your
                analytics data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
