'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useBillingData } from '@/hooks/useBillingData';
import { useClientFeatureFlags } from '@/hooks/use-client-feature-flags';
import { PlanPickerDialog } from '@/components/billing/PlanPickerDialog';
import { EmbeddedCheckoutDialog } from '@/components/billing/EmbeddedCheckoutDialog';
import { ChangePlanDialog } from '@/components/billing/ChangePlanDialog';
import { VerificationRequiredModal } from '@/components/accountVerification/VerificationRequiredModal';
import { createStripeCustomerPortalSession } from '@/actions/stripe.action';
import type { SelectedPlan } from '@/types/pricing';

interface BillingFlowContextValue {
  // Open the plan-picker dialog so the user can browse plans.
  openPlanPicker: () => void;
  // Skip the picker and go straight to the right flow for a specific plan
  selectPlan: (plan: SelectedPlan) => void;
}

const NOOP_VALUE: BillingFlowContextValue = {
  openPlanPicker: () => {},
  selectPlan: () => {},
};

const BillingFlowContext = createContext<BillingFlowContextValue | null>(null);

export function useBillingFlow(): BillingFlowContextValue {
  return useContext(BillingFlowContext) ?? NOOP_VALUE;
}

export function BillingFlowProvider({ children }: { children: ReactNode }) {
  const { isFeatureFlagEnabled } = useClientFeatureFlags();
  const { status } = useSession();
  const billingEnabled = isFeatureFlagEnabled('enableBilling');

  if (!billingEnabled || status !== 'authenticated') {
    return <BillingFlowContext.Provider value={NOOP_VALUE}>{children}</BillingFlowContext.Provider>;
  }

  return <BillingFlowProviderInner>{children}</BillingFlowProviderInner>;
}

function BillingFlowProviderInner({ children }: { children: ReactNode }) {
  const t = useTranslations('components.billing.interactive');
  const { data: session } = useSession();
  const { billingData } = useBillingData();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerInitialEventLimit, setPickerInitialEventLimit] = useState<number | undefined>();
  const [checkoutPlan, setCheckoutPlan] = useState<SelectedPlan | null>(null);
  const [changePlan, setChangePlan] = useState<SelectedPlan | null>(null);
  const [changePlanFromPicker, setChangePlanFromPicker] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  const openPlanPicker = useCallback(() => setPickerOpen(true), []);

  const openBillingPortal = useCallback(async () => {
    const result = await createStripeCustomerPortalSession();
    if (result.success) {
      // Full-page redirect (not window.open): the portal call is awaited, so a popup
      // opened here would be outside the click gesture and blocked by the browser.
      window.location.href = result.data;
    } else {
      toast.error(result.error.message);
    }
  }, []);

  const selectPlan = useCallback(
    (plan: SelectedPlan) => {
      if (plan.tier === 'enterprise') {
        toast.info(t('contactForCustomPlan'));
        return;
      }
      if (plan.price_cents === 0) {
        setPickerOpen(false);
        return;
      }
      if (!session?.user?.emailVerified) {
        setPickerOpen(false);
        setVerificationModalOpen(true);
        return;
      }
      setPickerOpen(false);

      // A past_due/unpaid subscription can't be charged for a plan change until the
      // payment method is fixed, so send these users to the Stripe portal to resolve it.
      const status = billingData?.subscription.status;
      if (status === 'past_due' || status === 'unpaid') {
        void openBillingPortal();
        return;
      }

      if (billingData?.isExistingPaidSubscriber) {
        setChangePlan(plan);
      } else {
        setCheckoutPlan(plan);
      }
    },
    [billingData, session, t, openBillingPortal],
  );

  const handleCheckoutOpenChange = useCallback((next: boolean) => {
    if (!next) setCheckoutPlan(null);
  }, []);

  const handleChangePlanOpenChange = useCallback((next: boolean) => {
    if (!next) {
      setChangePlan(null);
      setChangePlanFromPicker(false);
    }
  }, []);

  return (
    <BillingFlowContext.Provider value={{ openPlanPicker, selectPlan }}>
      {children}

      {billingData && (
        <PlanPickerDialog
          open={pickerOpen}
          onOpenChange={(next) => {
            setPickerOpen(next);
            if (!next) setPickerInitialEventLimit(undefined);
          }}
          billingData={billingData}
          initialEventLimit={pickerInitialEventLimit}
          onPlanSelected={(plan) => {
            setChangePlanFromPicker(true);
            selectPlan(plan);
          }}
        />
      )}

      <EmbeddedCheckoutDialog
        open={checkoutPlan !== null}
        onOpenChange={handleCheckoutOpenChange}
        plan={checkoutPlan}
      />

      <ChangePlanDialog
        open={changePlan !== null}
        onOpenChange={handleChangePlanOpenChange}
        onBack={
          changePlanFromPicker
            ? () => {
                setPickerInitialEventLimit(changePlan?.eventLimit);
                setChangePlan(null);
                setChangePlanFromPicker(false);
                setPickerOpen(true);
              }
            : undefined
        }
        targetPlan={changePlan}
        resumesCanceledSubscription={billingData?.subscription.cancelAtPeriodEnd ?? false}
      />

      {session?.user?.email && (
        <VerificationRequiredModal
          isOpen={verificationModalOpen}
          onClose={() => setVerificationModalOpen(false)}
          userEmail={session.user.email}
          userName={session.user.name || undefined}
        />
      )}
    </BillingFlowContext.Provider>
  );
}
