'use client';

import { Dispatch, useCallback, useState } from 'react';
import { NumberFlowGroup } from '@number-flow/react';
import { PricingSlider } from './PricingSlider';
import { PricingCards } from './PricingCards';
import { SelectedPlan } from '@/types/pricing';
import { cn } from '@/lib/utils';
import { EVENT_RANGES } from '@/lib/billing/plans';
import type { Currency, UserBillingData } from '@/entities/billing/billing.entities';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PricingComponentProps {
  onPlanSelect?: Dispatch<SelectedPlan>;
  initialRangeIndex?: number;
  className?: string;
  billingData?: UserBillingData;
  defaultCurrency?: Currency;
  lockedCurrency?: Currency;
  stickyControls?: boolean;
}

export function PricingComponent({
  onPlanSelect,
  initialRangeIndex = 0,
  className = '',
  billingData,
  defaultCurrency = 'USD',
  lockedCurrency,
  stickyControls = false,
}: PricingComponentProps) {
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(initialRangeIndex);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(lockedCurrency ?? defaultCurrency);
  const currentRange = EVENT_RANGES[selectedRangeIndex];

  const handleCurrencyChange = useCallback((currency: string) => {
    setSelectedCurrency(currency as Currency);
  }, []);

  return (
    <NumberFlowGroup>
      <div className={className}>
        <div
          className={cn(
            stickyControls
              ? 'bg-background border-border/60 sticky top-0 z-20 -mx-3 mb-8 border-b px-3 pt-5 pb-4 sm:-mx-8 sm:border-b-0 sm:px-8 sm:pt-6'
              : 'mb-8',
          )}
        >
          <div className='grid grid-cols-5 items-end justify-center gap-6'>
            <div className='col-span-5 col-start-1 lg:col-span-3 lg:col-start-2'>
              <PricingSlider
                currentRange={currentRange}
                selectedRangeIndex={selectedRangeIndex}
                onSelectIndex={setSelectedRangeIndex}
              />
            </div>
            {!lockedCurrency && (
              <div className='text-muted-foreground col-start-3 flex flex-shrink-0 justify-center text-xs lg:col-start-5 lg:justify-end'>
                <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger size='sm' className='cursor-pointer'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value='USD' className='cursor-pointer'>
                        USD ($)
                      </SelectItem>
                      <SelectItem value='EUR' className='cursor-pointer'>
                        EUR (€)
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <PricingCards
          eventRange={currentRange}
          onPlanSelect={onPlanSelect}
          mode={onPlanSelect ? 'billing' : 'landing'}
          billingData={billingData}
          currency={selectedCurrency}
        />
      </div>
    </NumberFlowGroup>
  );
}
