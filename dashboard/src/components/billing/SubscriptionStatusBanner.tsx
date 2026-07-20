import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PlanStatus } from '@/lib/billing/subscription-status';

interface SubscriptionStatusBannerProps {
  planStatus: PlanStatus;
  periodEnd: Date;
  onAction?: () => void;
}

const BANNER = {
  canceling: {
    container: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
    icon: 'text-orange-600 dark:text-orange-400',
    title: 'text-orange-800 dark:text-orange-200',
    body: 'text-orange-700 dark:text-orange-300',
    titleKey: 'canceledBannerTitle',
    actionKey: 'reactivate',
    buttonVariant: 'outline',
  },
  pastDue: {
    container: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    body: 'text-red-700 dark:text-red-300',
    titleKey: 'pastDueBannerTitle',
    actionKey: 'updatePayment',
    buttonVariant: 'destructive',
  },
} as const;

export function SubscriptionStatusBanner({ planStatus, periodEnd, onAction }: SubscriptionStatusBannerProps) {
  const t = useTranslations('components.billing.currentPlan');
  const locale = useLocale();

  if (planStatus !== 'canceling' && planStatus !== 'pastDue') {
    return null;
  }

  const cfg = BANNER[planStatus];
  const body =
    planStatus === 'canceling'
      ? t('canceledBannerBody', { date: periodEnd.toLocaleDateString(locale) })
      : t('pastDueBannerBody');

  return (
    <div className={cn('flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center', cfg.container)}>
      <div className='flex flex-1 items-center gap-3'>
        <AlertCircle className={cn('h-5 w-5 flex-shrink-0', cfg.icon)} />
        <div className='min-w-0 flex-1'>
          <p className={cn('text-sm font-medium', cfg.title)}>{t(cfg.titleKey)}</p>
          <p className={cn('text-xs', cfg.body)}>{body}</p>
        </div>
      </div>
      {onAction && (
        <Button
          variant={cfg.buttonVariant}
          size='sm'
          onClick={onAction}
          className='w-full shrink-0 cursor-pointer sm:w-auto'
        >
          <ExternalLink className='mr-2 h-4 w-4' />
          {t(cfg.actionKey)}
        </Button>
      )}
    </div>
  );
}
