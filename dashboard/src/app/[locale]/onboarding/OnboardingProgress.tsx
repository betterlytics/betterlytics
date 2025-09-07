'use client';

import { usePathname } from 'next/navigation';
import { Stepper } from '@/components/ui/stepper';
import { useCallback, useMemo } from 'react';

type Steps = 'account' | 'website' | 'integration';

type OnboardingPorgressProps = {
  step: Steps;
};

export function OnboardingProgress({ step }: OnboardingPorgressProps) {
  const steps = useMemo(() => [{ label: 'Account' }, { label: 'Website' }, { label: 'Integration' }], []);

  const getCurrentStep = useCallback(() => {
    if (step === 'account') return 1;
    if (step === 'website') return 2;
    if (step === 'integration') return 3;
    return 1;
  }, [step]);

  return (
    <div className='mt-2 mb-6 w-full md:mt-6'>
      <Stepper steps={steps} currentStep={getCurrentStep()} />
    </div>
  );
}
