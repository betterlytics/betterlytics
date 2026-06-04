import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { changeSubscriptionPlan, syncSubscriptionPlanChangeStatus } from '@/actions/billing.action';
import { confirm3DS } from '@/lib/billing/stripe-client';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import type { SelectedPlan } from '@/types/pricing';

export type PlanChangeFailure = { code?: string; message: string };

export type PlanChangePhase = 'idle' | 'applying' | 'authenticating' | 'finalizing' | 'success' | 'failure';

const AUTH_REQUIRED_CODE = 'authentication_required';

function toFailure(error: { message: string; code?: unknown }, fallbackCode?: string): PlanChangeFailure {
  return {
    code: typeof error.code === 'string' ? error.code : fallbackCode,
    message: error.message,
  };
}

export function useSubscriptionPlanChange() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('components.billing.changePlan');
  const { PUBLIC_STRIPE_PUBLISHABLE_KEY } = usePublicEnvironmentVariablesContext();

  const [phase, setPhase] = useState<PlanChangePhase>('idle');
  const [failure, setFailure] = useState<PlanChangeFailure | null>(null);
  const attemptIdRef = useRef<string | null>(null);

  const fail = (f: PlanChangeFailure) => {
    setFailure(f);
    setPhase('failure');
  };

  const run = (flow: () => Promise<void>) => {
    void (async () => {
      try {
        await flow();
      } catch (error) {
        console.error('Unexpected error during plan change:', error);
        fail({ message: t('errors.unexpected') });
      }
    })();
  };

  const succeed = () => {
    queryClient.invalidateQueries({ queryKey: ['userBilling'] });
    queryClient.invalidateQueries({ queryKey: ['userInvoices'] });
    router.refresh();
    setPhase('success');
  };

  const finalize = async () => {
    setPhase('finalizing');
    const status = await syncSubscriptionPlanChangeStatus();
    if (!status.success) {
      fail(toFailure(status.error));
    } else if (status.data.status === 'succeeded') {
      succeed();
    } else {
      fail({ code: AUTH_REQUIRED_CODE, message: '' });
    }
  };

  const authenticate = async (clientSecret: string) => {
    setPhase('authenticating');
    await confirm3DS(PUBLIC_STRIPE_PUBLISHABLE_KEY, clientSecret);
    await finalize();
  };

  const confirm = (targetPlan: SelectedPlan) => {
    const attemptId = attemptIdRef.current;
    if (!attemptId) return;
    setFailure(null);
    setPhase('applying');
    run(async () => {
      const result = await changeSubscriptionPlan(targetPlan, attemptId);
      if (!result.success) {
        fail(toFailure(result.error));
      } else if (result.data.status === 'succeeded') {
        succeed();
      } else {
        await authenticate(result.data.clientSecret);
      }
    });
  };

  const retryAuth = () => {
    setFailure(null);
    setPhase('finalizing');
    run(async () => {
      const status = await syncSubscriptionPlanChangeStatus();
      if (!status.success) {
        fail(toFailure(status.error));
      } else if (status.data.status === 'succeeded') {
        succeed();
      } else {
        await authenticate(status.data.clientSecret);
      }
    });
  };

  const begin = useCallback(() => {
    attemptIdRef.current = crypto.randomUUID();
    setFailure(null);
    setPhase('idle');
  }, []);

  const reset = useCallback(() => {
    attemptIdRef.current = null;
    setFailure(null);
    setPhase('idle');
  }, []);

  return {
    confirm,
    retryAuth,
    begin,
    reset,
    phase,
    failure,
    isPending: phase === 'applying' || phase === 'authenticating' || phase === 'finalizing',
  };
}
