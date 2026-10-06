import { Link } from '@/i18n/navigation';
import { BrandLink } from '@/landing/components/ui/brandMark';
import { InView } from '@/landing/components/ui/inView';
import voltCard from '@/landing/components/ui/voltCard.module.css';
import { cn } from '@/landing/lib/cn';
import { ArrowRightIcon } from '@/landing/signin/_auth/icons';
import { SignInForm } from '@/landing/signin/_auth/signInForm';
import type { VariantProps } from '@/landing/signin/_auth/types';
import { CobeGlobe, type GlobeLook } from './cobeGlobe';
import { Copyright, LegalLinks, SignUpPrompt } from './shared';
import { SpaceShader } from './spaceShader';
import { Starfield } from './starfield';
import styles from './volt.module.css';

type Latest = { version: string; title: string } | undefined;

/* Illustrative visitor cities, kept literal; warm, like the lamp. */
const ARRIVALS: [number, number][] = [
  [55.7, 12.6],
  [51.5, -0.1],
  [52.5, 13.4],
  [40.4, -3.7],
  [59.3, 18.1],
  [48.9, 2.35],
  [40.7, -74.0],
  [43.7, -79.4],
  [30.0, 31.2],
  [6.5, 3.4],
  [25.2, 55.3],
  [-23.5, -46.6],
];

/* White land dots and no glow of cobe's own: the layer's filter (volt.module.css) cuts each dot's soft halo to a
   crisp edge, which would also blacken a glow, so the disc draws the atmosphere instead. */
const LOOK: GlobeLook = {
  dark: 1,
  diffuse: 2.5,
  mapSamples: 50000,
  mapBrightness: 2,
  mapBaseBrightness: 0,
  baseColor: [1, 1, 1],
  markerColor: [1, 0.9, 0.74],
  glowColor: [0, 0, 0],
  markers: ARRIVALS.map((location) => ({ location, size: 0.016 })),
};
const SPIN = { kind: 'spin', radPerSecond: 0.045 } as const;

/**
 * A — the form on the canvas; beside it the hero's blue card, with a globe rising into the lamp.
 * A2 (`scene='space'`) — the card turned to deep space in CSS: the planet and its sunrise are the only blue left in it.
 * A3 (`scene='shader'`) — the same space drawn by a fragment shader: nebula, stars, a lit atmosphere, the sun behind it.
 */
export function VoltVariant({
  latest,
  scene = 'card',
  ...props
}: VariantProps & { latest: Latest; scene?: 'card' | 'space' | 'shader' }) {
  const { copy, registration } = props;
  return (
    <div className={styles.root}>
      <section className={styles.side}>
        <header className='flex items-center justify-between gap-6'>
          <BrandLink />
          <SignUpPrompt copy={copy} registration={registration} className='max-sm:hidden' />
        </header>

        <div className='flex flex-1 items-center justify-center py-14 max-sm:py-10'>
          <div className={cn(styles.column, 'w-full max-w-[392px]')}>
            <h1 className='text-[2.75rem] leading-[2.875rem] font-medium tracking-[-0.09rem] max-sm:text-[2.25rem] max-sm:leading-10'>
              {copy.welcomeBack}
            </h1>
            <p className='mt-3.5 max-w-[34ch] text-lede text-pretty text-muted'>{copy.voltLede}</p>
            <SignInForm className='mt-10' {...props} order='oauth-first' oauth='row' />
            <SignUpPrompt copy={copy} registration={registration} className='mt-8 sm:hidden' />
          </div>
        </div>

        <footer className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-caption text-muted'>
          <Copyright />
          <LegalLinks copy={copy} />
        </footer>
      </section>

      <InView
        className={cn(voltCard.card, styles.panel)}
        data-space={scene !== 'card' || undefined}
        data-shader={scene === 'shader' || undefined}
      >
        {scene === 'card' ? (
          <div className={voltCard.wave} aria-hidden>
            <i />
          </div>
        ) : null}
        {scene === 'space' ? <Starfield className={styles.stars} drift={0} perMegapixel={120} /> : null}
        <div className={styles.planet} aria-hidden>
          {scene === 'shader' ? null : <div className={cn(voltCard.bloom, styles.bloom)} />}
          <div className={styles.disc} data-planet />
          <CobeGlobe
            look={LOOK}
            facingLng={0}
            theta={0.32}
            motion={SPIN}
            className={styles.globe}
            layerClassName={cn('mix-blend-screen', styles.dots)}
          />
        </div>
        {scene === 'shader' ? <SpaceShader className={styles.shader} /> : null}
        <div className={styles.panelInner}>
          {latest ? (
            <Link href='/changelog' className={styles.pill}>
              <span className={styles.pillTag}>{latest.version}</span>
              <span className={styles.pillText}>
                <span className='sr-only'>{copy.whatsNew}: </span>
                {latest.title}
              </span>
              <ArrowRightIcon className='size-3.5 flex-none' />
            </Link>
          ) : null}
          <h2 className={styles.title}>
            {copy.voltTitle}
            <span className='block text-on-volt/60'>{copy.voltTitleMuted}</span>
          </h2>
        </div>
      </InView>
    </div>
  );
}
