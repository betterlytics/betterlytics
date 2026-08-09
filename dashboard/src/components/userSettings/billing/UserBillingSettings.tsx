'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useBillingData } from '@/hooks/useBillingData';
import { useBillingFlow } from '@/contexts/BillingFlowProvider';
import { createStripeCustomerPortalSession } from '@/actions/stripe.action';
import { CancelSubscriptionDialog } from '@/components/billing/CancelSubscriptionDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanStatusBadge } from '@/components/billing/PlanStatusBadge';
import { SubscriptionStatusBanner } from '@/components/billing/SubscriptionStatusBanner';
import UserBillingUsageSettings from './UserBillingUsageSettings';
import { formatPrice } from '@/utils/pricing';
import { derivePlanStatus } from '@/lib/billing/subscription-status';
import UserSettingsSection from '../shared/UserSettingsSection';
import SettingRow from '../shared/SettingRow';
import UserBillingInvoicesSettings from './UserBillingInvoicesSettings';

interface UserBillingSettingsProps {
  onCloseDialog?: () => void;
}

export default function UserBillingSettings({ onCloseDialog }: UserBillingSettingsProps) {
  const t = useTranslations('components.userSettings.billing');
  const locale = useLocale();
  const { billingData, isLoading, error } = useBillingData();
  const { openPlanPicker } = useBillingFlow();

  const handleOpenPortal = async () => {
    const result = await createStripeCustomerPortalSession();
    if (result.success) {
      window.open(result.data, '_blank', 'noopener,noreferrer');
    } else {
      toast.error(t('portal.openError'));
    }
  };

  const handleViewPlans = () => {
    onCloseDialog?.();
    openPlanPicker();
  };

  if (isLoading) {
    return (
      <div>
        <UserSettingsSection title={t('currentPlan.title')}>
          <Skeleton className='h-12 w-full' />
        </UserSettingsSection>
        <UserSettingsSection title={t('usage.title')}>
          <Skeleton className='h-12 w-full' />
        </UserSettingsSection>
      </div>
    );
  }

  if (error || !billingData) {
    return <p className='text-muted-foreground'>{t('loadError')}</p>;
  }

  const { subscription, usage } = billingData;
  const isPaid = billingData.isExistingPaidSubscriber;

  const planStatus = derivePlanStatus(subscription.status, subscription.cancelAtPeriodEnd);
  const canCancel = isPaid && (planStatus === 'active' || planStatus === 'pastDue');

  const renewalDate = subscription.currentPeriodEnd.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const priceLabel =
    subscription.pricePerMonth === 0
      ? t('currentPlan.free')
      : t('currentPlan.pricePerMonth', {
          price: formatPrice(subscription.pricePerMonth, subscription.currency, locale),
        });

  let periodLabel: string;
  if (planStatus === 'pastDue') {
    periodLabel = t('currentPlan.pastDue');
  } else if (planStatus === 'canceling') {
    periodLabel = t('currentPlan.endsOn', { date: renewalDate });
  } else {
    periodLabel = t('currentPlan.renewsOn', { date: renewalDate });
  }

  const planSummary = isPaid ? `${priceLabel} (${periodLabel})` : priceLabel;

  return (
    <div>
      <UserSettingsSection title={t('currentPlan.title')}>
        <SubscriptionStatusBanner
          planStatus={planStatus}
          periodEnd={subscription.currentPeriodEnd}
          onAction={handleOpenPortal}
        />
        <SettingRow
          label={
            <span className='flex items-center gap-2'>
              <span className='capitalize'>{subscription.tier}</span>
              {isPaid && <PlanStatusBadge planStatus={planStatus} />}
            </span>
          }
          description={planSummary}
          action={
            <Button
              variant={isPaid ? 'outline' : 'default'}
              size='sm'
              onClick={handleViewPlans}
              className='cursor-pointer'
            >
              {isPaid ? t('currentPlan.changePlan') : t('currentPlan.upgrade')}
            </Button>
          }
        />
      </UserSettingsSection>

      <UserBillingUsageSettings usage={usage} />

      {isPaid && (
        <UserSettingsSection title={t('payment.title')}>
          <SettingRow
            label={t('payment.label')}
            description={t('payment.description')}
            action={
              <Button variant='outline' size='sm' onClick={handleOpenPortal} className='cursor-pointer'>
                <ExternalLinkIcon className='mr-2 h-4 w-4' />
                {t('payment.openPortal')}
              </Button>
            }
          />
        </UserSettingsSection>
      )}

      <UserBillingInvoicesSettings />

      {canCancel && (
        <UserSettingsSection title={t('cancellation.title')}>
          <SettingRow
            label={t('cancellation.label')}
            description={t('cancellation.description')}
            action={
              <CancelSubscriptionDialog tier={subscription.tier} isActive={canCancel}>
                <Button variant='destructive' size='sm' className='cursor-pointer'>
                  {t('cancellation.cancel')}
                </Button>
              </CancelSubscriptionDialog>
            }
          />
        </UserSettingsSection>
      )}
    </div>
  );
}
