import type { ReactNode } from 'react';
import { InView } from '@/landing/components/ui/inView';
import { cn } from '@/landing/lib/cn';
import styles from './voltCard.module.css';

const VARIANTS = {
  /** The demo frame rides up into it by --hero-overlap; the copy sits in the part left above the frame.
      Phones have no frame, so there it ends on the closing card's lamp, filling most of the first
      screen with the next section peeking below. */
  hero: 'h-[760px] pt-16 pb-(--hero-overlap) max-lg:h-auto max-lg:pt-18 max-lg:pb-[calc(var(--hero-overlap)+48px)] max-sm:min-h-[calc((100svh-9rem)*0.97)] max-sm:pt-14 max-sm:pb-12',
  cta: 'h-[528px] max-lg:h-auto max-lg:pt-16 max-lg:pb-[100px]',
} as const;

/**
 * The blue card behind the hero and the closing call to action: the page's hatch in
 * the card's own tint, a slow wave of light along it, and a lamp glowing up from
 * below. Children are centred in a column. The wave rests while the card is off screen.
 */
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
