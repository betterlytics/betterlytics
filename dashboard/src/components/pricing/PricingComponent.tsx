'use client';

import { Dispatch, useCallback, useState } from 'react';
import { PricingSlider } from './PricingSlider';
import { PricingCards } from './PricingCards';
import { SelectedPlan } from '@/types/pricing';
import { EVENT_RANGES } from '@/lib/billing/plans';
import type { Currency, UserBillingData } from '@/entities/billing';
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
}

export function PricingComponent({
  onPlanSelect,
  initialRangeIndex = 0,
  className = '',
  billingData,
  defaultCurrency = 'USD',
}: PricingComponentProps) {
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(initialRangeIndex);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);
  const currentRange = EVENT_RANGES[selectedRangeIndex];

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    setSelectedRangeIndex(index);
  }, []);

  const handleCurrencyChange = useCallback((currency: string) => {
    setSelectedCurrency(currency as Currency);
  }, []);

  return (
    <div className={className}>
      <div className='mb-8 grid grid-cols-5 items-end justify-center gap-6'>
        <div className='col-span-5 col-start-1 lg:col-span-3 lg:col-start-2'>
          <PricingSlider
            currentRange={currentRange}
            selectedRangeIndex={selectedRangeIndex}
            handleSliderChange={handleSliderChange}
          />
        </div>
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
      </div>

      <PricingCards
        eventRange={currentRange}
        onPlanSelect={onPlanSelect}
        mode={onPlanSelect ? 'billing' : 'landing'}
        billingData={billingData}
        currency={selectedCurrency}
      />
    </div>
  );
}
