'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import ExternalLink from '@/components/ExternalLink';
import { createStripeCustomerPortalSession } from '@/actions/stripe';
import { toast } from 'sonner';
import { useBillingData } from '@/hooks/useBillingData';
import SettingsCard from '@/components/SettingsCard';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserBillingHistory() {
  const { billingData, isLoading } = useBillingData();
  const t = useTranslations('components.userSettings.billingPortal');

  const handleViewBillingHistory = async () => {
    try {
      const portalUrl = await createStripeCustomerPortalSession();
      if (portalUrl.success) {
        window.open(portalUrl.data, '_blank');
      } else {
        throw new Error('No customer portal URL received');
      }
    } catch {
      toast.error(t('toastError'));
    }
  };

  if (isLoading) {
    return (
      <SettingsCard icon={CreditCard} title={t('title')} description={t('description')}>
        <div className='flex min-h-[225px] flex-col items-center justify-center py-4 text-center'>
          <div className='mb-2 h-6 w-56'>
            <Skeleton className='h-6 w-56' />
          </div>
          <div className='mb-6 h-4 w-80'>
            <Skeleton className='h-4 w-80' />
          </div>
          <div className='h-9 w-44'>
            <Skeleton className='h-9 w-44' />
          </div>
        </div>
        <div className='mt-6 border-t pt-4'>
          <div className='mx-auto h-4 w-72'>
            <Skeleton className='mx-auto h-4 w-72' />
          </div>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard icon={CreditCard} title={t('title')} description={t('description')}>
      <div className='flex min-h-[225px] flex-col items-center justify-center py-4 text-center'>
        <h3 className='mb-2 text-lg font-medium'>{t('access')}</h3>
        <p className='text-muted-foreground mb-6 text-sm'>{t('explainer')}</p>

        {billingData?.isExistingPaidSubscriber ? (
          <Button onClick={handleViewBillingHistory} className='flex cursor-pointer items-center gap-2'>
            <ExternalLinkIcon className='h-4 w-4' />
            {t('accessButton')}
          </Button>
        ) : (
          <p className='text-muted-foreground text-sm'>{t('notAvailable')}</p>
        )}
      </div>

      <div className='mt-6 border-t pt-4'>
        <p className='text-muted-foreground text-center text-sm'>
          {t('needHelp')}{' '}
          <ExternalLink href='mailto:support@betterlytics.io' className='text-primary hover:underline'>
            {t('contactSupport')}
          </ExternalLink>
        </p>
      </div>
    </SettingsCard>
  );
}
