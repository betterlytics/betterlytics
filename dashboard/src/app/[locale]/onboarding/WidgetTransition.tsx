'use client';

import { usePathname } from '@/i18n/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode } from 'react';
import { OnboardingProgress } from './OnboardingProgress';

type WidgetTransitionProps = {
  children: ReactNode;
};

export function WidgetTransition({ children }: WidgetTransitionProps) {
  const pathname = usePathname();
  return (
    <main className='relative mb-0 flex h-full min-h-svh flex-1 flex-col items-center gap-2 overflow-hidden pt-6'>
      <OnboardingProgress />
      <AnimatePresence mode='wait'>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='w-full'
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
