'use client';

import { usePathname } from 'next/navigation';
import { Stepper } from '@/components/ui/stepper';
import { useCallback, useMemo } from 'react';

export function OnboardingProgress() {
  const pathname = usePathname();

  const steps = useMemo(() => [{ label: 'Account' }, { label: 'Website' }, { label: 'Integration' }], []);

  const getCurrentStep = useCallback(() => {
    if (pathname === '/onboarding/account') return 1;
    if (pathname === '/onboarding/website') return 2;
    if (pathname === '/onboarding/integration') return 3;
    return 1;
  }, [pathname]);

  return (
    <div className='mb-6'>
      <Stepper steps={steps} currentStep={getCurrentStep()} />
    </div>
  );
}
