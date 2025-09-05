'use client';

import { usePathname } from '@/i18n/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode } from 'react';

type WidgetTransitionProps = {
  children: ReactNode;
};

export function WidgetTransition({ children }: WidgetTransitionProps) {
  const pathname = usePathname();
  return (
    <main className='relative flex-1 overflow-hidden'>
      <AnimatePresence mode='wait'>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='absolute h-full w-full'
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
