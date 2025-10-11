'use client';

import { useState } from 'react';
import { OnboardingProgress } from './OnboardingProgress';
import { AnimatePresence, motion } from 'motion/react';
import AccountCreation from './steps/AccountCreation';
import WebsiteSetup from './steps/WebsiteSetup';
import Integration from './steps/Integration';
import { getProviders } from 'next-auth/react';
import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';

type Steps = 'account' | 'website' | 'integration';

type OnboardingPageProps = {
  initialStep: Steps;
  providers: Awaited<ReturnType<typeof getProviders>>;
};

export default function OnboardingPage({ initialStep, providers }: OnboardingPageProps) {
  const [step, setStep] = useState<Steps>(initialStep);

  return (
    <main className='relative mb-0 flex w-full flex-1 flex-col items-center gap-2 pt-6'>
      <div className='mb-2 flex w-full justify-center md:mb-6'>
        <Link href='/' className='flex items-center space-x-2'>
          <Logo variant='simple' showText textSize='lg' priority />
        </Link>
      </div>
      <OnboardingProgress step={step} />
      <AnimatePresence mode='wait'>
        {step === 'account' && (
          <motion.div
            key='account'
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='w-full'
          >
            <AccountCreation providers={providers} onNext={() => setStep('website')} />
          </motion.div>
        )}
        {step === 'website' && (
          <motion.div
            key='website'
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='w-full'
          >
            <WebsiteSetup onNext={() => setStep('integration')} />
          </motion.div>
        )}
        {step === 'integration' && (
          <motion.div
            key='integration'
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='w-full'
          >
            <Integration />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
