import type { ReactNode } from 'react';
import { InView } from '@/landing/components/ui/inView';
import { cn } from '@/landing/lib/cn';
import styles from './voltCard.module.css';

const VARIANTS = {
  /** the demo frame rides up into it by --hero-overlap */
  hero: 'h-[760px] pt-16 pb-(--hero-overlap) max-lg:h-auto max-lg:pt-18 max-lg:pb-[calc(var(--hero-overlap)+48px)] max-sm:min-h-[calc((100svh-9rem)*0.97)] max-sm:pt-14 max-sm:pb-12',
  cta: 'h-[528px] max-lg:h-auto max-lg:pt-16 max-lg:pb-[100px] max-sm:rounded-none max-sm:pt-30 max-sm:pb-42',
} as const;

export function VoltCardActions({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mt-1.5 flex flex-wrap justify-center gap-2.5 max-sm:w-full max-sm:flex-col', className)}>
      {children}
    </div>
  );
}

export function VoltCard({ variant, children }: { variant: keyof typeof VARIANTS; children: ReactNode }) {
  return (
    <InView
      className={cn(
        styles.card,
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-volt',
        VARIANTS[variant],
      )}
    >
      <div className={styles.wave} aria-hidden>
        <i />
      </div>
      <div className={cn(styles.bloom, styles[variant])} aria-hidden />
      <div className='relative z-2 flex w-full flex-col items-center gap-[34px] px-6 text-center'>{children}</div>
    </InView>
  );
}
