import { getUserBillingData } from '@/actions/billing.action';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getPlanNameKey } from '@/lib/billing/plans';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { Calendar } from 'lucide-react';

export default async function PlanQuota({
  billingDataPromise,
}: {
  billingDataPromise: ReturnType<typeof getUserBillingData>;
}) {
  const billing = await billingDataPromise;
  if (!billing?.success) return null;

  const { current, limit } = billing.data.usage;
  const percentage = Math.min(100, Math.round((current / Math.max(1, limit)) * 100));
  const tier = billing.data.subscription.tier;
  const isCanceled = billing.data.subscription.cancelAtPeriodEnd;
  const t = await getTranslations('components.billing');
  const planKey = getPlanNameKey(tier);
  const planLabel = planKey ? t(`planNames.${planKey}`) : t('currentPlan.plan');

  return (
    <div className='flex w-full min-w-0 flex-col gap-2 rounded-md py-1 text-sm sm:min-w-[280px]'>
      <div className='flex items-center justify-between'>
        <div className='font-medium'>{t('currentPlan.eventUsage')}</div>
        <Link
          href='/billing'
          className='text-primary hover:text-primary/90 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium'
        >
          {t('currentPlan.manage')}
        </Link>
      </div>

      <div className='text-2xl font-semibold'>
        {formatNumber(current)}
        <span className='text-muted-foreground text-base font-normal'> / {formatNumber(limit)}</span>
      </div>

      <div className='flex items-center justify-between text-xs'>
        <span className='text-muted-foreground'>{planLabel}</span>
        <span>{formatPercentage(percentage)}</span>
      </div>

      <div className='bg-muted h-1.5 w-full rounded'>
        <div
          className='bg-primary h-1.5 rounded'
          style={{ width: `${percentage}%` }}
          aria-label={t('currentPlan.eventUsage')}
          role='progressbar'
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={current}
        />
      </div>

      <div className='text-muted-foreground flex items-center gap-1 text-xs'>
        <Calendar size={12} className='text-muted-foreground' />
        <span>
          {isCanceled
            ? t('currentPlan.expiresInDays', { days: billing.data.usage.daysUntilReset })
            : t('currentPlan.resetsInDays', { days: billing.data.usage.daysUntilReset })}
        </span>
      </div>
    </div>
  );
}
