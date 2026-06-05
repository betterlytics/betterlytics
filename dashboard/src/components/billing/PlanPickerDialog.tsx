'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PricingComponent } from '@/components/pricing/PricingComponent';
import { FeatureComparisonSection } from '@/components/billing/FeatureComparisonSection';
import { EVENT_RANGES } from '@/lib/billing/plans';
import type { SelectedPlan } from '@/types/pricing';
import type { UserBillingData } from '@/entities/billing/billing.entities';

interface PlanPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingData: UserBillingData;
  onPlanSelected: (plan: SelectedPlan) => void;
  initialEventLimit?: number;
}

export function PlanPickerDialog({
  open,
  onOpenChange,
  billingData,
  onPlanSelected,
  initialEventLimit,
}: PlanPickerDialogProps) {
  const t = useTranslations('components.billing.planPicker');
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const comparisonTriggerRef = useRef<HTMLButtonElement>(null);

  const handleComparisonAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.currentTarget !== e.target || !comparisonOpen) return;
    comparisonTriggerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const initialRangeIndex = useMemo(() => {
    const eventLimit = initialEventLimit ?? billingData.subscription.eventLimit;
    const idx = EVENT_RANGES.findIndex((r) => r.value === eventLimit);
    return idx >= 0 ? idx : 0;
  }, [initialEventLimit, billingData.subscription.eventLimit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex h-[97dvh] max-h-[930px] w-[95vw] max-w-[1200px] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:min-h-[740px] sm:max-w-[1200px]'
        overlayClassName='bg-white/90 dark:bg-black/95 backdrop-blur-xs'
      >
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <div className='px-3 pt-5 pb-6 sm:px-8 sm:pt-7'>
            <DialogHeader className='pb-9 sm:text-center'>
              <DialogTitle className='text-2xl'>{t('title')}</DialogTitle>
              <DialogDescription className='sr-only'>{t('description')}</DialogDescription>
            </DialogHeader>

            <PricingComponent
              billingData={billingData}
              defaultCurrency={billingData.subscription.currency ?? 'USD'}
              lockedCurrency={
                billingData.subscription.currencyLocked ? billingData.subscription.currency : undefined
              }
              initialRangeIndex={initialRangeIndex}
              onPlanSelect={onPlanSelected}
              stickyControls
            />

            <Collapsible open={comparisonOpen} onOpenChange={setComparisonOpen} className='group/comparison mt-20'>
              <CollapsibleTrigger
                ref={comparisonTriggerRef}
                className='text-muted-foreground hover:text-foreground mx-auto flex cursor-pointer scroll-mt-4 items-center gap-1.5 text-sm transition-colors'
              >
                {comparisonOpen ? t('hideComparison') : t('showComparison')}
                <ChevronDown className='h-4 w-4 transition-transform group-data-[state=open]/comparison:rotate-180' />
              </CollapsibleTrigger>
              <CollapsibleContent
                onAnimationEnd={handleComparisonAnimationEnd}
                className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-clip'
              >
                <div className='mt-6'>
                  <FeatureComparisonSection />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
