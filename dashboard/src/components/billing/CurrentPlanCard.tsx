'use client';

import { PlanStatusBadge } from './PlanStatusBadge';
import { SubscriptionStatusBanner } from './SubscriptionStatusBanner';
import { CreditBalanceCallout } from './CreditBalanceCallout';
import { derivePlanStatus } from '@/lib/billing/subscription-status';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { formatPrice } from '@/utils/pricing';
import { createStripeCustomerPortalSession } from '@/actions/stripe.action';
import { CancelSubscriptionDialog } from './CancelSubscriptionDialog';
import { toast } from 'sonner';
import type { UserBillingData } from '@/entities/billing/billing.entities';
import { useLocale, useTranslations } from 'next-intl';

interface CurrentPlanCardProps {
  billingData: UserBillingData;
  showManagementButtons?: boolean;
}

export function CurrentPlanCard({ billingData, showManagementButtons = false }: CurrentPlanCardProps) {
  const { subscription, usage } = billingData;
  const t = useTranslations('components.billing.currentPlan');
  const locale = useLocale();

  const planStatus = derivePlanStatus(subscription.status, subscription.cancelAtPeriodEnd);
  const isCanceled = planStatus === 'canceling';
  const isPastDue = planStatus === 'pastDue';
  const canCancel = planStatus === 'active' || planStatus === 'pastDue';

  const handleManageSubscription = async () => {
    try {
      const portalUrl = await createStripeCustomerPortalSession();
      if (portalUrl.success) {
        window.location.href = portalUrl.data;
      } else {
        throw new Error('No customer portal URL received');
      }
    } catch {
      toast.error('Failed to open subscription management, please try again.');
    }
  };

  return (
    <div className='bg-card space-y-4 rounded-lg border p-6'>
      <SubscriptionStatusBanner planStatus={planStatus} periodEnd={subscription.currentPeriodEnd} />
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <TrendingUp size={16} className='text-muted-foreground' />
            <h3 className='text-lg font-semibold'>{t('title')}</h3>
            <PlanStatusBadge planStatus={planStatus} />
          </div>
          {isCanceled ? (
            <p className='text-muted-foreground text-sm'>{t('expiresInDays', { days: usage.daysUntilReset })}</p>
          ) : (
            <p className='text-muted-foreground text-sm'>{t('description')}</p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='flex justify-between sm:block sm:space-y-3'>
          <div>
            <div className='text-muted-foreground text-sm'>{t('plan')}</div>
            <div className='font-semibold capitalize'>{subscription.tier}</div>
          </div>
          <div className='text-right sm:text-left'>
            <div className='text-muted-foreground text-sm'>{t('monthlyPrice')}</div>
            <div className='font-semibold'>
              {subscription.pricePerMonth === 0
                ? t('free')
                : formatPrice(subscription.pricePerMonth, subscription.currency, locale)}
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <TrendingUp size={16} className='text-muted-foreground' />
              <span className='text-sm font-medium'>{t('eventUsage')}</span>
            </div>
            {!isCanceled && (
              <p className='text-muted-foreground text-xs'>
                {t('resetsInDays', { days: usage.daysUntilReset })}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                {t('usageProgress', {
                  current: formatNumber(usage.current, locale),
                  limit: formatNumber(usage.limit, locale),
                })}
              </span>
              <span className={`font-medium ${usage.isOverLimit ? 'text-red-500' : 'text-foreground'}`}>
                {formatPercentage(usage.usagePercentage, locale)}
              </span>
            </div>

            <Progress value={Math.min(usage.usagePercentage, 100)} className='h-2' color='var(--primary)' />
          </div>
        </div>
      </div>

      <CreditBalanceCallout variant='plain' />

      {showManagementButtons && billingData.isExistingPaidSubscriber && (
        <div className='flex flex-wrap justify-end gap-2'>
          <Button onClick={handleManageSubscription} size='sm' className='flex items-center gap-2'>
            <ExternalLink className='mr-2 h-4 w-4' />
            {isCanceled ? t('reactivate') : isPastDue ? t('updatePayment') : t('manage')}
          </Button>

          {canCancel && (
            <CancelSubscriptionDialog tier={subscription.tier} isActive={canCancel}>
              <Button variant='outline' size='sm' className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4' />
                {t('cancel')}
              </Button>
            </CancelSubscriptionDialog>
          )}
        </div>
      )}
    </div>
  );
}
