'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SuccessCheckmark } from '@/components/billing/SuccessCheckmark';
import { FailureCheckmark } from '@/components/billing/FailureCheckmark';
import { getSubscriptionChangePreview } from '@/actions/billing.action';
import { createStripeCustomerPortalSession } from '@/actions/stripe.action';
import {
  useSubscriptionPlanChange,
  type PlanChangeFailure,
  type PlanChangePhase,
} from '@/hooks/useSubscriptionPlanChange';
import type { SelectedPlan } from '@/types/pricing';
import type {
  SubscriptionChangePreview,
  SubscriptionChangePreviewLine,
} from '@/entities/billing/billing.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatPrice } from '@/utils/pricing';
import { formatNumber } from '@/utils/formatters';

const SUCCESS_AUTO_CLOSE_MS = 2400;
const CLOSE_ANIMATION_MS = 200;

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
  targetPlan: SelectedPlan | null;
}

export function ChangePlanDialog({ open, onOpenChange, onBack, targetPlan }: ChangePlanDialogProps) {
  const t = useTranslations('components.billing.changePlan');
  const locale = useLocale() as SupportedLanguages;
  const queryClient = useQueryClient();

  const planChange = useSubscriptionPlanChange();
  const { phase, begin, reset } = planChange;

  const previewQuery = useQuery({
    queryKey: ['subscriptionChangePreview', targetPlan?.lookup_key, targetPlan?.currency],
    enabled: open && targetPlan !== null && (phase === 'idle' || phase === 'applying'),
    queryFn: async () => {
      if (!targetPlan) throw new Error('No plan selected');
      const result = await getSubscriptionChangePreview(targetPlan);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (open) {
      begin();
      return;
    }

    const timer = setTimeout(() => {
      reset();
      queryClient.removeQueries({ queryKey: ['subscriptionChangePreview'] });
    }, CLOSE_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [open, queryClient, begin, reset]);

  useEffect(() => {
    if (phase !== 'success') return;
    const timer = setTimeout(() => onOpenChange(false), SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [phase, onOpenChange]);

  const isPreview = phase === 'idle' || phase === 'applying';
  const isAuthRequired = planChange.failure?.code === 'authentication_required';
  const isCardDeclined = planChange.failure?.code === 'card_declined';
  const canDismiss = !planChange.isPending && phase !== 'success';

  return (
    <Dialog open={open} onOpenChange={(next) => canDismiss && onOpenChange(next)}>
      <DialogContent className='sm:max-w-md' overlayClassName='bg-white/85 dark:bg-black/85 backdrop-blur-sm'>
        <DialogHeader className={isPreview ? undefined : 'sr-only'}>
          <DialogTitle>{t(getHeaderLabelKey(phase, isAuthRequired))}</DialogTitle>
          <DialogDescription className='sr-only'>{t('description')}</DialogDescription>
        </DialogHeader>

        {phase === 'success' ? (
          <SuccessCheckmark
            label={t('successLabel')}
            description={targetPlan ? t('successDescription', { tier: targetPlan.tier }) : undefined}
          />
        ) : phase === 'authenticating' ? (
          <PendingBody label={t('authenticatingLabel')} description={t('authenticatingDescription')} />
        ) : phase === 'finalizing' ? (
          <PendingBody label={t('finalizingLabel')} />
        ) : phase === 'failure' && planChange.failure ? (
          <FailureBody
            failure={planChange.failure}
            isAuthRequired={isAuthRequired}
            isCardDeclined={isCardDeclined}
            isBusy={planChange.isPending}
            onRetryAuth={planChange.retryAuth}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <>
            <PreviewBody query={previewQuery} targetPlan={targetPlan} locale={locale} />

            <div className='flex items-center justify-end gap-2'>
              <Button
                variant='ghost'
                onClick={() => (onBack ? onBack() : onOpenChange(false))}
                disabled={planChange.isPending}
                className='cursor-pointer'
              >
                {t('back')}
              </Button>
              <Button
                onClick={() => targetPlan && planChange.confirm(targetPlan)}
                disabled={planChange.isPending || previewQuery.isLoading || previewQuery.isError || !targetPlan}
                className='cursor-pointer'
              >
                {planChange.isPending && <Spinner size='sm' className='mr-2 border-current' />}
                {t('confirm')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PendingBodyProps {
  label: string;
  description?: string;
}

function PendingBody({ label, description }: PendingBodyProps) {
  return (
    <div className='text-muted-foreground flex flex-col items-center justify-center gap-3 py-10 text-center'>
      <Spinner />
      <p className='text-foreground text-base font-semibold'>{label}</p>
      {description && <p className='text-sm'>{description}</p>}
    </div>
  );
}

interface FailureBodyProps {
  failure: PlanChangeFailure;
  isAuthRequired: boolean;
  isCardDeclined: boolean;
  isBusy: boolean;
  onRetryAuth: () => void;
  onClose: () => void;
}

function FailureBody({ failure, isAuthRequired, isCardDeclined, isBusy, onRetryAuth, onClose }: FailureBodyProps) {
  const t = useTranslations('components.billing.changePlan');
  const [openingPortal, setOpeningPortal] = useState(false);

  const messageKey = getFailureMessageKey({ isAuthRequired, isCardDeclined });
  const localizedMessage = messageKey ? t(messageKey) : failure.message;

  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    const portal = await createStripeCustomerPortalSession();
    if (portal.success) {
      window.open(portal.data, '_blank', 'noopener,noreferrer');
    } else {
      toast.error(portal.error.message);
    }
    setOpeningPortal(false);
  };

  return (
    <div className='flex flex-col gap-4'>
      <FailureCheckmark
        label={isAuthRequired ? t('authRequiredLabel') : t('failureLabel')}
        description={localizedMessage}
      />

      <div
        className={cn(
          'flex items-center gap-2',
          isCardDeclined || isAuthRequired ? 'justify-between' : 'justify-center',
        )}
      >
        <Button variant='ghost' onClick={onClose} disabled={openingPortal || isBusy} className='cursor-pointer'>
          {t('close')}
        </Button>
        {isAuthRequired && (
          <Button onClick={onRetryAuth} disabled={isBusy} className='cursor-pointer'>
            {isBusy && <Spinner size='sm' className='mr-2 border-current' />}
            {t('tryAgain')}
          </Button>
        )}
        {isCardDeclined && (
          <Button onClick={handleOpenPortal} disabled={openingPortal} className='cursor-pointer'>
            {openingPortal && <Spinner size='sm' className='mr-2 border-current' />}
            {t('updatePaymentMethod')}
          </Button>
        )}
      </div>
    </div>
  );
}

interface PreviewBodyProps {
  query: ReturnType<typeof useQuery<SubscriptionChangePreview, Error>>;
  targetPlan: SelectedPlan | null;
  locale: SupportedLanguages;
}

function PreviewBody({ query, targetPlan, locale }: PreviewBodyProps) {
  const t = useTranslations('components.billing.changePlan');

  if (query.isLoading || !targetPlan) {
    return (
      <div className='text-muted-foreground flex items-center gap-2 py-4 text-sm'>
        <Spinner size='sm' />
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <p className='text-destructive py-4 text-sm'>{t('error')}</p>;
  }

  const { amountDue, currency, nextRenewalAmount, nextRenewalDate, appliedBalance, lines } = query.data;
  const { charge, credit } = summarizeProration(lines);
  const isCredit = amountDue < 0;

  const amountAbs = Math.abs(amountDue);
  const renewalAmount = nextRenewalAmount || targetPlan.price_cents;
  const renewalDateText = nextRenewalDate.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const summaryKey = isCredit ? 'summaryCredit' : 'summaryCharge';
  const summary = t(summaryKey, {
    tier: targetPlan.tier,
    events: formatNumber(targetPlan.eventLimit, locale),
    amount: formatPrice(amountAbs, currency, locale),
    date: renewalDateText,
    nextAmount: formatPrice(renewalAmount, currency, locale),
  });

  const hasLineItems = charge > 0 || credit > 0 || appliedBalance > 0;

  return (
    <div className='space-y-6 py-1 text-sm'>
      <p className='text-muted-foreground leading-relaxed'>{summary}</p>

      <div className='overflow-hidden rounded-lg border'>
        {hasLineItems && (
          <dl className='space-y-2.5 p-4'>
            {charge > 0 && <Row label={t('newPlanCharge')} amount={formatPrice(charge, currency, locale)} />}
            {credit > 0 && (
              <Row
                label={t('unusedTimeCredit')}
                amount={`−${formatPrice(credit, currency, locale)}`}
                tone='credit'
              />
            )}
            {appliedBalance > 0 && (
              <Row
                label={t('accountCreditApplied')}
                amount={`−${formatPrice(appliedBalance, currency, locale)}`}
                tone='credit'
              />
            )}
          </dl>
        )}

        <div
          className={cn(
            'bg-muted/50 flex items-baseline justify-between gap-4 px-4 py-3',
            hasLineItems && 'border-t',
          )}
        >
          <span className='text-foreground font-semibold'>
            {isCredit ? t('totalCreditedToday') : t('totalDueToday')}
          </span>
          <span
            className={cn(
              'text-lg font-semibold whitespace-nowrap tabular-nums',
              isCredit && 'text-emerald-600 dark:text-emerald-400',
            )}
          >
            {formatPrice(amountAbs, currency, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  amount: string;
  tone?: 'credit';
}

function Row({ label, amount, tone }: RowProps) {
  return (
    <div className='flex items-baseline justify-between gap-4'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd
        className={cn(
          'whitespace-nowrap tabular-nums',
          tone === 'credit' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {amount}
      </dd>
    </div>
  );
}

function getHeaderLabelKey(phase: PlanChangePhase, isAuthRequired: boolean) {
  switch (phase) {
    case 'success':
      return 'successLabel';
    case 'failure':
      return isAuthRequired ? 'authRequiredLabel' : 'failureLabel';
    case 'authenticating':
      return 'authenticatingLabel';
    case 'finalizing':
      return 'finalizingLabel';
    default:
      return 'title';
  }
}

function getFailureMessageKey({
  isAuthRequired,
  isCardDeclined,
}: {
  isAuthRequired: boolean;
  isCardDeclined: boolean;
}) {
  if (isAuthRequired) return 'errors.authenticationRetry';
  if (isCardDeclined) return 'errors.cardDeclined';
  return null;
}

function summarizeProration(lines: SubscriptionChangePreviewLine[]): { charge: number; credit: number } {
  let charge = 0;
  let credit = 0;
  for (const line of lines) {
    if (!line.proration) continue;
    if (line.amount >= 0) {
      charge += line.amount;
    } else {
      credit += Math.abs(line.amount);
    }
  }
  return { charge, credit };
}
