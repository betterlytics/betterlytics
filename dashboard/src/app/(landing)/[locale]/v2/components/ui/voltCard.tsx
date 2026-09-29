import type { ReactNode } from 'react';
import { cn } from '@/landing/lib/cn';
import styles from './voltCard.module.css';

const VARIANTS = {
  /** The demo frame rides up into it by --hero-overlap; the copy sits in the part left above the frame. */
  hero: 'h-[760px] pt-16 pb-(--hero-overlap) max-lg:h-auto max-lg:pt-18 max-lg:pb-[calc(var(--hero-overlap)+48px)]',
  cta: 'h-[528px] max-lg:h-auto max-lg:pt-16 max-lg:pb-[100px]',
} as const;

/**
 * The blue card behind the hero and the closing call to action: the page's hatch in
 * the card's own tint, a slow wave of light along it, and a lamp glowing up from
 * below. Children are centred in a column.
 */
export function VoltCard({ variant, children }: { variant: keyof typeof VARIANTS; children: ReactNode }) {
  return (
    <div
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
    </div>
  );
}
