import { useLocale, useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PlanStatus } from '@/lib/billing/subscription-status';

interface SubscriptionStatusBannerProps {
  planStatus: PlanStatus;
  periodEnd: Date;
  onAction?: () => void;
}

const BANNER = {
  canceling: {
    variant: 'warning',
    titleKey: 'canceledBannerTitle',
    actionKey: 'reactivate',
    buttonVariant: 'outline',
  },
  pastDue: {
    variant: 'destructive',
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
    <Alert variant={cfg.variant}>
      <AlertTitle>{t(cfg.titleKey)}</AlertTitle>
      <AlertDescription>{body}</AlertDescription>
      {onAction && (
        <AlertAction>
          <Button variant={cfg.buttonVariant} size='sm' onClick={onAction} className='cursor-pointer'>
            <ExternalLink />
            {t(cfg.actionKey)}
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}
