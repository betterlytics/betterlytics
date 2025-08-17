'use client';

import { useCallback, useMemo } from 'react';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingProvider';
import { Stepper } from '@/components/ui/stepper';
import { AccountCreationStep } from './steps/AccountCreationStep';
import { WebsiteSetupStep } from './steps/WebsiteSetupStep';
import { IntegrationStep } from './steps/IntegrationStep';

function OnboardingProgress() {
  const { state } = useOnboarding();

  const steps = useMemo(
    () => [
      { label: 'Account', description: 'Create account' },
      { label: 'Website', description: 'Add your site' },
      { label: 'Integration', description: 'Install tracking' },
    ],
    [],
  );

  return (
    <div className='mb-8'>
      <Stepper steps={steps} currentStep={state.currentStep} />
    </div>
  );
}

function OnboardingContent() {
  const { state } = useOnboarding();

  const renderStep = useCallback(() => {
    switch (state.currentStep) {
      case 1:
        return <AccountCreationStep />;
      case 2:
        return <WebsiteSetupStep />;
      case 3:
        return <IntegrationStep />;
      default:
        return <div>Unknown step</div>;
    }
  }, [state.currentStep]);

  return <div className='min-h-[400px] space-y-6'>{renderStep()}</div>;
}

function OnboardingWizardContent() {
  return (
    <div className='container mx-auto max-w-2xl px-4 py-12'>
      <div className='bg-card rounded-lg border p-8 shadow-sm'>
        <OnboardingProgress />
        <OnboardingContent />
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  return (
    <OnboardingProvider>
      <OnboardingWizardContent />
    </OnboardingProvider>
  );
}
