'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SuccessCheckmark } from '@/components/billing/SuccessCheckmark';
import { FailureCheckmark } from '@/components/billing/FailureCheckmark';
import { changeSubscriptionPlan, getSubscriptionChangePreview } from '@/actions/billing.action';
import { createStripeCustomerPortalSession } from '@/actions/stripe.action';
import type { SelectedPlan } from '@/types/pricing';
import type {
  SubscriptionChangePreview,
  SubscriptionChangePreviewLine,
} from '@/entities/billing/billing.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatPrice } from '@/utils/pricing';
import { formatNumber } from '@/utils/formatters';

const SUCCESS_AUTO_CLOSE_MS = 2400;

type FailureState = { code?: string; message: string };

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
  const [isApplying, startApplying] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [failure, setFailure] = useState<FailureState | null>(null);
  // Fresh idempotency-attempt id per dialog open
  const attemptIdRef = useRef<string | null>(null);

  const previewQuery = useQuery({
    queryKey: ['subscriptionChangePreview', targetPlan?.lookup_key, targetPlan?.currency],
    enabled: open && targetPlan !== null && !showSuccess && !failure,
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
      attemptIdRef.current = crypto.randomUUID();
    } else {
      attemptIdRef.current = null;
      queryClient.removeQueries({ queryKey: ['subscriptionChangePreview'] });
      setShowSuccess(false);
      setFailure(null);
    }
  }, [open, queryClient]);

  const handleConfirm = () => {
    if (!targetPlan || !attemptIdRef.current) return;
    const attemptId = attemptIdRef.current;
    startApplying(async () => {
      const result = await changeSubscriptionPlan(targetPlan, attemptId);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['userBilling'] });
        queryClient.invalidateQueries({ queryKey: ['userInvoices'] });
        setShowSuccess(true);
        setTimeout(() => onOpenChange(false), SUCCESS_AUTO_CLOSE_MS);
      } else {
        setFailure({
          code: typeof result.error.code === 'string' ? result.error.code : undefined,
          message: result.error.message,
        });
      }
    });
  };

  const isAuthRequired = failure?.code === 'authentication_required';
  const isCardDeclined = failure?.code === 'card_declined';
  const headerLabel = t(getHeaderLabelKey({ showSuccess, hasFailure: failure !== null, isAuthRequired }));

  return (
    <Dialog open={open} onOpenChange={(next) => !isApplying && !showSuccess && onOpenChange(next)}>
      <DialogContent className='sm:max-w-md' overlayClassName='bg-white/85 dark:bg-black/85 backdrop-blur-sm'>
        <DialogHeader className={showSuccess || failure ? 'sr-only' : undefined}>
          <DialogTitle>{headerLabel}</DialogTitle>
          <DialogDescription className='sr-only'>{t('description')}</DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <SuccessCheckmark
            label={t('successLabel')}
            description={targetPlan ? t('successDescription', { tier: targetPlan.tier }) : undefined}
          />
        ) : failure ? (
          <FailureBody
            failure={failure}
            isAuthRequired={isAuthRequired}
            isCardDeclined={isCardDeclined}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <>
            <PreviewBody query={previewQuery} targetPlan={targetPlan} locale={locale} />

            <div className='flex items-center justify-end gap-2'>
              <Button
                variant='ghost'
                onClick={() => (onBack ? onBack() : onOpenChange(false))}
                disabled={isApplying}
                className='cursor-pointer'
              >
                {t('back')}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isApplying || previewQuery.isLoading || previewQuery.isError || !targetPlan}
                className='cursor-pointer'
              >
                {isApplying && <Spinner size='sm' className='mr-2 border-current' />}
                {t('confirm')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FailureBodyProps {
  failure: FailureState;
  isAuthRequired: boolean;
  isCardDeclined: boolean;
  onClose: () => void;
}

function FailureBody({ failure, isAuthRequired, isCardDeclined, onClose }: FailureBodyProps) {
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
      {isAuthRequired ? (
        <div className='flex flex-col items-center justify-center gap-3 py-6 text-center'>
          <Mail className='text-muted-foreground h-16 w-16' strokeWidth={1.25} />
          <p className='text-base font-semibold'>{t('authRequiredLabel')}</p>
          <p className='text-muted-foreground text-sm'>{localizedMessage}</p>
        </div>
      ) : (
        <FailureCheckmark label={t('failureLabel')} description={localizedMessage} />
      )}

      <div className={cn('flex items-center gap-2', isCardDeclined ? 'justify-between' : 'justify-center')}>
        <Button variant='ghost' onClick={onClose} disabled={openingPortal} className='cursor-pointer'>
          {t('close')}
        </Button>
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

  return (
    <div className='space-y-4 py-1 text-sm'>
      <p className='text-muted-foreground'>{summary}</p>

      <dl className='space-y-2'>
        {charge > 0 && <Row label={t('newPlanCharge')} amount={formatPrice(charge, currency, locale)} />}
        {credit > 0 && (
          <Row label={t('unusedTimeCredit')} amount={`−${formatPrice(credit, currency, locale)}`} tone='credit' />
        )}
        {appliedBalance > 0 && (
          <Row
            label={t('accountCreditApplied')}
            amount={`−${formatPrice(appliedBalance, currency, locale)}`}
            tone='credit'
          />
        )}
      </dl>

      <div className='border-border border-t pt-3'>
        <Row
          label={isCredit ? t('totalCreditedToday') : t('totalDueToday')}
          amount={formatPrice(amountAbs, currency, locale)}
          emphasize
        />
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  amount: string;
  tone?: 'credit';
  emphasize?: boolean;
}

function Row({ label, amount, tone, emphasize }: RowProps) {
  return (
    <div className='flex items-baseline justify-between gap-4'>
      <dt className={emphasize ? 'text-foreground font-semibold' : 'text-muted-foreground'}>{label}</dt>
      <dd
        className={cn(
          'whitespace-nowrap tabular-nums',
          emphasize && 'text-base font-semibold',
          tone === 'credit' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {amount}
      </dd>
    </div>
  );
}

function getHeaderLabelKey({
  showSuccess,
  hasFailure,
  isAuthRequired,
}: {
  showSuccess: boolean;
  hasFailure: boolean;
  isAuthRequired: boolean;
}) {
  if (showSuccess) return 'successLabel';
  if (!hasFailure) return 'title';
  return isAuthRequired ? 'authRequiredLabel' : 'failureLabel';
}

function getFailureMessageKey({
  isAuthRequired,
  isCardDeclined,
}: {
  isAuthRequired: boolean;
  isCardDeclined: boolean;
}) {
  if (isAuthRequired) return 'errors.authenticationRequired';
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
