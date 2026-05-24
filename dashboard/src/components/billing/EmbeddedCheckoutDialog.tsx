'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { getStripeClient } from '@/lib/billing/stripe-client';
import { createStripeCheckoutSession } from '@/actions/stripe.action';
import type { SelectedPlan } from '@/types/pricing';

// Minimum DialogContent width at which Stripe embedded_page renders the two-column
// (order summary + payment form) layout. Below this it collapses to single column.
// Determined empirically — Stripe does not expose this threshold via API.
const STRIPE_TWO_COLUMN_MIN_PX = 1060;

interface EmbeddedCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SelectedPlan | null;
}

export function EmbeddedCheckoutDialog({ open, onOpenChange, plan }: EmbeddedCheckoutDialogProps) {
  const t = useTranslations('components.billing.embeddedCheckout');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { PUBLIC_STRIPE_PUBLISHABLE_KEY } = usePublicEnvironmentVariablesContext();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    if (!PUBLIC_STRIPE_PUBLISHABLE_KEY) return null;
    return getStripeClient(PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }, [PUBLIC_STRIPE_PUBLISHABLE_KEY]);

  useEffect(() => {
    if (!open || !plan || clientSecret) {
      return;
    }
    let canceled = false;
    (async () => {
      const result = await createStripeCheckoutSession(plan);
      if (canceled) return;
      if (result.success) {
        setClientSecret(result.data.clientSecret);
        setSessionId(result.data.sessionId);
      } else {
        setHasError(true);
        toast.error(t('loadError'));
      }
    })();
    return () => {
      canceled = true;
    };
  }, [open, plan, clientSecret, t]);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setSessionId(null);
      setHasError(false);
    }
  }, [open]);

  const handleComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['userBilling'] });
    queryClient.invalidateQueries({ queryKey: ['userInvoices'] });
    onOpenChange(false);
    if (sessionId) {
      router.push(`/billing/success?session_id=${sessionId}`);
    }
  }, [queryClient, onOpenChange, router, sessionId]);

  const checkoutOptions = useMemo(
    () => (clientSecret ? { clientSecret, onComplete: handleComplete } : null),
    [clientSecret, handleComplete],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ maxWidth: `${STRIPE_TWO_COLUMN_MIN_PX}px` }}
        className='dark bg-background max-h-[92vh] min-h-[600px] w-[95vw] gap-0 overflow-hidden rounded-3xl p-0 shadow-2xl [&>button]:hidden'
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className='h-full overflow-y-auto py-4 md:py-6'>
          {hasError || !stripePromise ? (
            <div className='text-muted-foreground p-8 text-center text-sm'>{t('loadError')}</div>
          ) : checkoutOptions ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={checkoutOptions}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
            <div className='text-muted-foreground flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-sm'>
              <Spinner />
              <span>{t('creatingSession')}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
