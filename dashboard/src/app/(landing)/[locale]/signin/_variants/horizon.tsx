import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/landing/lib/cn';
import type { SignInCopy } from '@/landing/signin/_auth/copy';
import { ArrowLeftIcon } from '@/landing/signin/_auth/icons';
import type { VariantProps } from '@/landing/signin/_auth/types';
import { HorizonStage } from './horizonStage';
import { Copyright } from './shared';
import { GlowShader } from './glowShader';
import { SpaceShader } from './spaceShader';
import { Starfield } from './starfield';
import styles from './horizon.module.css';

/** `shader`: `planet` draws C4's orbital horizon, `glow` draws C2's lamp; both replace the CSS sky. */
export type HorizonLook = { tone?: 'lamp' | 'volt' | 'none'; stars?: boolean; shader?: 'planet' | 'glow' };

/* C4's planet: its limb crosses the page at 80% of the height, below the form, curving gently (1.6 widths of radius). */
const HORIZON = { top: 0.8, radius: 1.6 };

/** Horizon's page around any auth step: the lamp at the bottom edge, the way back, and the fine print. */
export function HorizonShell({
  copy,
  tone = 'lamp',
  stars = false,
  shader,
  children,
}: HorizonLook & { copy: SignInCopy; children: ReactNode }) {
  return (
    <div className={styles.root} data-tone={tone}>
      <div className={styles.sky} aria-hidden>
        {shader === 'planet' ? (
          <SpaceShader className={styles.shader} horizon={HORIZON} />
        ) : shader === 'glow' ? (
          <GlowShader className={styles.shader} />
        ) : tone === 'none' ? null : (
          <>
            {stars ? <Starfield className={styles.stars} drift={3.5} /> : null}
            <div className={styles.glow} />
            <div className={styles.hatch} />
          </>
        )}
      </div>

      {/* the way back only; signing up is offered under the buttons, where a new visitor is already looking */}
      <header className='flex h-[90px] items-center px-7 max-sm:h-[74px] max-sm:px-(--pad)'>
        <Link
          href='/'
          className='group inline-flex items-center gap-2 text-label text-muted transition-colors duration-180 ease-out-expo hover:text-fg'
        >
          <ArrowLeftIcon className='size-3.5 transition-transform duration-180 ease-out-expo group-hover:-translate-x-0.5' />
          {copy.backToSite}
        </Link>
      </header>

      <main className='flex flex-1 items-center justify-center px-(--pad) pt-6 pb-[16vh] max-sm:pb-24'>{children}</main>

      <footer
        className={cn(
          'flex items-center justify-center gap-5 pb-7 text-caption text-on-volt/70',
          '[&_a]:transition-colors [&_a]:duration-180 [&_a:hover]:text-on-volt',
        )}
      >
        <Copyright />
        <Link href='/terms'>{copy.terms}</Link>
        <Link href='/privacy'>{copy.privacy}</Link>
      </footer>
    </div>
  );
}

/**
 * C — almost nothing on the page; the landing's lamp rises from the bottom edge.
 * C2 (`tone='volt'`) — the same lamp in the hero card's brighter blue.
 * C3 (`tone='volt' stars`) — C2 seen from orbit: faint stars drift above the glow, which reads as an atmosphere.
 * C4 (`tone='volt' shader`) — C3 drawn by a fragment shader: a real planet's limb, its lit air, the sun rising behind it.
 * C5 (`tone='none'`) — no light at all: the form alone on the canvas.
 * C6 (`tone='volt' shader='glow'`) — C2's lamp drawn by a fragment shader, its edge and blue band slowly alive.
 */
export function HorizonVariant({ tone, stars, shader, ...props }: VariantProps & HorizonLook) {
  return (
    <HorizonShell copy={props.copy} tone={tone} stars={stars} shader={shader}>
      <HorizonStage {...props} />
    </HorizonShell>
  );
}
