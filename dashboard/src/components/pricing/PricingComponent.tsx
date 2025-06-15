'use client';

import { useCallback, useState } from 'react';
import { PricingSlider } from './PricingSlider';
import { PricingCards } from './PricingCards';
import { SelectedPlan } from '@/types/pricing';
import { EVENT_RANGES } from '@/lib/billing/plans';
import type { UserBillingData } from '@/entities/billing';

interface PricingComponentProps {
  onPlanSelect?: (planData: SelectedPlan) => void;
  initialRangeIndex?: number;
  className?: string;
  billingData?: UserBillingData;
}

export function PricingComponent({
  onPlanSelect,
  initialRangeIndex = 0,
  className = '',
  billingData,
}: PricingComponentProps) {
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(initialRangeIndex);
  const currentRange = EVENT_RANGES[selectedRangeIndex];

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    setSelectedRangeIndex(index);
  }, []);

  return (
    <div className={className}>
      <PricingSlider
        currentRange={currentRange}
        selectedRangeIndex={selectedRangeIndex}
        handleSliderChange={handleSliderChange}
        className='mb-12'
      />

      <PricingCards
        eventLimit={currentRange.value}
        eventLabel={currentRange.label}
        basePrice={currentRange.price}
        onPlanSelect={onPlanSelect}
        mode={onPlanSelect ? 'billing' : 'landing'}
        billingData={billingData}
      />
    </div>
  );
}
