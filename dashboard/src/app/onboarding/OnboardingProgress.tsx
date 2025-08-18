'use client';

import { usePathname } from 'next/navigation';
import { Stepper } from '@/components/ui/stepper';
import { useMemo } from 'react';

export function OnboardingProgress() {
  const pathname = usePathname();
  
  const steps = useMemo(
    () => [
      { label: 'Account', description: 'Create account' },
      { label: 'Website', description: 'Add your site' },
      { label: 'Integration', description: 'Install tracking' },
    ],
    [],
  );

  const getCurrentStep = () => {
    if (pathname === '/onboarding/account') return 1;
    if (pathname === '/onboarding/website') return 2;
    if (pathname === '/onboarding/integration') return 3;
    return 1;
  };

  return (
    <div className='mb-8'>
      <Stepper steps={steps} currentStep={getCurrentStep()} />
    </div>
  );
}