'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, AlertTriangle, ExternalLink, AlertCircle } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { formatPrice } from '@/utils/pricing';
import { createStripeCustomerPortalSession } from '@/actions/stripe';
import { CancelSubscriptionDialog } from './CancelSubscriptionDialog';
import { toast } from 'sonner';
import type { UserBillingData } from '@/entities/billing';
import { useTranslations } from 'next-intl';

interface CurrentPlanCardProps {
  billingData: UserBillingData;
  showManagementButtons?: boolean;
}

export function CurrentPlanCard({ billingData, showManagementButtons = false }: CurrentPlanCardProps) {
  const { subscription, usage } = billingData;
  const tPlan = useTranslations('components.billing.currentPlan');

  const isCanceled = subscription.cancelAtPeriodEnd;
  const isActive = subscription.status === 'active';

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
      {isCanceled && (
        <div className='flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950'>
          <AlertCircle className='h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400' />
          <div className='flex-1'>
            <p className='text-sm font-medium text-orange-800 dark:text-orange-200'>
              {tPlan('canceledBannerTitle')}
            </p>
            <p className='text-xs text-orange-700 dark:text-orange-300'>
              {tPlan('canceledBannerBody', { date: subscription.currentPeriodEnd.toLocaleDateString() })}
            </p>
          </div>
        </div>
      )}
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <TrendingUp size={16} className='text-muted-foreground' />
            <h3 className='text-lg font-semibold'>{tPlan('title')}</h3>
            {isCanceled ? (
              <Badge variant='destructive' className='capitalize'>
                {tPlan('canceled')}
              </Badge>
            ) : (
              <Badge variant={isActive ? 'default' : 'secondary'} className='capitalize'>
                {subscription.status}
              </Badge>
            )}
          </div>
          {isCanceled ? (
            <p className='text-muted-foreground text-sm'>
              {tPlan('expiresInDays', { days: usage.daysUntilReset })}
            </p>
          ) : (
            <p className='text-muted-foreground text-sm'>{tPlan('description')}</p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-3'>
          <div>
            <div className='text-muted-foreground text-sm'>{tPlan('plan')}</div>
            <div className='font-semibold capitalize'>{subscription.tier}</div>
          </div>
          <div>
            <div className='text-muted-foreground text-sm'>{tPlan('monthlyPrice')}</div>
            <div className='font-semibold'>
              {subscription.pricePerMonth === 0
                ? tPlan('free')
                : formatPrice(subscription.pricePerMonth, subscription.currency)}
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <TrendingUp size={16} className='text-muted-foreground' />
            <span className='text-sm font-medium'>{tPlan('eventUsage')}</span>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                {tPlan('usageProgress', {
                  current: formatNumber(usage.current),
                  limit: formatNumber(usage.limit),
                })}
              </span>
              <span className={`font-medium ${usage.isOverLimit ? 'text-red-500' : 'text-foreground'}`}>
                {formatPercentage(usage.usagePercentage)}
              </span>
            </div>

            <Progress value={Math.min(usage.usagePercentage, 100)} className='h-2' color='var(--primary)' />
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Calendar size={14} />
          {isCanceled ? (
            <span>{tPlan('expiresInDays', { days: usage.daysUntilReset })}</span>
          ) : (
            <span>{tPlan('resetsInDays', { days: usage.daysUntilReset })}</span>
          )}
        </div>

        {showManagementButtons && billingData.isExistingPaidSubscriber && (
          <div className='flex gap-2'>
            <Button onClick={handleManageSubscription} size='sm' className='flex items-center gap-2'>
              <ExternalLink className='mr-2 h-4 w-4' />
              {isCanceled ? tPlan('reactivate') : tPlan('manage')}
            </Button>

            {!isCanceled && (
              <CancelSubscriptionDialog tier={subscription.tier} isActive={isActive}>
                <Button variant='outline' size='sm' disabled={!isActive} className='flex items-center gap-2'>
                  <AlertTriangle className='h-4 w-4' />
                  {tPlan('cancel')}
                </Button>
              </CancelSubscriptionDialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
