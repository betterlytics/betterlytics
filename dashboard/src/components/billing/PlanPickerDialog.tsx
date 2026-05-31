'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  const initialRangeIndex = useMemo(() => {
    const eventLimit = initialEventLimit ?? billingData.subscription.eventLimit;
    const idx = EVENT_RANGES.findIndex((r) => r.value === eventLimit);
    return idx >= 0 ? idx : 0;
  }, [initialEventLimit, billingData.subscription.eventLimit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex h-[97vh] max-h-[930px] min-h-[740px] w-[95vw] max-w-[1200px] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[1200px]'
        overlayClassName='bg-white/90 dark:bg-black/95 backdrop-blur-xs'
      >
        <ScrollArea className='min-h-0 flex-1'>
          <div className='px-8 pt-7 pb-6'>
            <DialogHeader className='pb-9 sm:text-center'>
              <DialogTitle className='text-2xl'>{t('title')}</DialogTitle>
              <DialogDescription className='sr-only'>{t('description')}</DialogDescription>
            </DialogHeader>

            <PricingComponent
              billingData={billingData}
              defaultCurrency={billingData.subscription.currency ?? 'USD'}
              lockedCurrency={billingData.subscription.currencyLocked ? billingData.subscription.currency : undefined}
              initialRangeIndex={initialRangeIndex}
              onPlanSelect={onPlanSelected}
            />

            <Collapsible open={comparisonOpen} onOpenChange={setComparisonOpen} className='group/comparison mt-20'>
              <CollapsibleTrigger className='text-muted-foreground hover:text-foreground mx-auto flex cursor-pointer items-center gap-1.5 text-sm transition-colors'>
                {comparisonOpen ? t('hideComparison') : t('showComparison')}
                <ChevronDown className='h-4 w-4 transition-transform group-data-[state=open]/comparison:rotate-180' />
              </CollapsibleTrigger>
              <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-clip'>
                <div className='mt-6'>
                  <FeatureComparisonSection />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
