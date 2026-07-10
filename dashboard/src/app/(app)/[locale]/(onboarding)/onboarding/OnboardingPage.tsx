'use client';

import { useState, useEffect } from 'react';
import { baEvent } from '@/lib/ba-event';
import { OnboardingProgress } from './OnboardingProgress';
import { AnimatePresence, motion } from 'motion/react';
import WebsiteSetup from './steps/WebsiteSetup';
import Integration from './steps/Integration';
import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

type Steps = 'website' | 'integration';

type OnboardingPageProps = {
  initialStep: Steps;
};

function useNewUserEvent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('newUser') !== 'true') return;
    baEvent('onboarding-account-created');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('newUser');
    router.replace(params.size > 0 ? `${pathname}?${params}` : pathname, { scroll: false });
  }, []);
}

export default function OnboardingPage({ initialStep }: OnboardingPageProps) {
  const [step, setStep] = useState<Steps>(initialStep);

  useNewUserEvent();

  return (
    <main className='relative mb-0 flex w-full flex-1 flex-col items-center gap-2 pt-6'>
      <div className='mb-2 flex w-full justify-center md:mb-6'>
        <Link href='/' className='flex items-center space-x-2'>
          <Logo variant='simple' showText textSize='lg' priority />
        </Link>
      </div>
      <OnboardingProgress step={step} />
      <AnimatePresence mode='wait'>
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
