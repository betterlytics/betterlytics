'use client';

import { Stepper } from '@/components/ui/stepper';
import { useCallback, useMemo } from 'react';

type Steps = 'website' | 'integration';

type OnboardingPorgressProps = {
  step: Steps;
};

export function OnboardingProgress({ step }: OnboardingPorgressProps) {
  const steps = useMemo(() => [{ label: 'Website' }, { label: 'Integration' }], []);

  const getCurrentStep = useCallback(() => {
    if (step === 'website') return 1;
    if (step === 'integration') return 2;
    return 1;
  }, [step]);

  return (
    <div className='mt-2 mb-6 w-full md:mt-6'>
      <Stepper steps={steps} currentStep={getCurrentStep()} />
    </div>
  );
}
