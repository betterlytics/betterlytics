import { BrandLink } from '@/landing/components/ui/brandMark';
import { cn } from '@/landing/lib/cn';
import { SignInForm } from '@/landing/signin/_auth/signInForm';
import type { VariantProps } from '@/landing/signin/_auth/types';
import { type Arrival, CobeGlobe, type GlobeLook } from './cobeGlobe';
import { Copyright, LegalLinks, SignUpPrompt } from './shared';
import styles from './meridian.module.css';

/* Mock arrivals, kept literal like the landing globe's, all on the hemisphere the sway keeps in view. */
const ARRIVALS: Arrival[] = [
  { id: 'lon', city: 'London, GB', source: 'Google', lat: 51.5, lng: -0.1 },
  { id: 'nyc', city: 'New York, US', source: 'Google', lat: 40.7, lng: -74.0 },
  { id: 'cph', city: 'Copenhagen, DK', source: 'ChatGPT', lat: 55.7, lng: 12.6 },
  { id: 'sao', city: 'São Paulo, BR', source: 'direct', lat: -23.5, lng: -46.6 },
  { id: 'ams', city: 'Amsterdam, NL', source: 'Hacker News', lat: 52.4, lng: 4.9 },
  { id: 'yto', city: 'Toronto, CA', source: 'newsletter', lat: 43.7, lng: -79.4 },
  { id: 'los', city: 'Lagos, NG', source: 'X', lat: 6.5, lng: 3.4 },
  { id: 'mad', city: 'Madrid, ES', source: 'Claude', lat: 40.4, lng: -3.7 },
  { id: 'bog', city: 'Bogotá, CO', source: 'LinkedIn', lat: 4.7, lng: -74.1 },
  { id: 'ber', city: 'Berlin, DE', source: 'Google', lat: 52.5, lng: 13.4 },
  { id: 'cpt', city: 'Cape Town, ZA', source: 'direct', lat: -33.9, lng: 18.4 },
  { id: 'par', city: 'Paris, FR', source: 'Perplexity', lat: 48.9, lng: 2.35 },
];

const LOOK: GlobeLook = {
  dark: 1,
  diffuse: 1.2,
  mapSamples: 44000,
  mapBrightness: 1.9,
  mapBaseBrightness: 0.015,
  baseColor: [0.37, 0.355, 0.345],
  markerColor: [0.62, 0.66, 0.98],
  glowColor: [0.08, 0.09, 0.18],
  markers: [], // the arrivals are drawn on the overlay instead
};
/* facing the Atlantic keeps the Americas, Europe and Africa in view; the sway never turns them away */
const SWAY = { kind: 'sway', amplitude: 0.2, periodMs: 64_000 } as const;
const GRID = { color: 'rgb(235 232 230)', alpha: 0.055 };

/* No glow of its own: a page's shader draws the air around it. */
const SEE_THROUGH: GlobeLook = { ...LOOK, glowColor: [0, 0, 0] };

/**
 * The Meridian globe, lit from behind its upper-left limb; `className` may re-place the stage.
 * `transparent`, as on the landing: the body (darker than the page) vanishes under a lighten blend, leaving the land, the
 * grid and the far side; the page behind must be opaque and share its stacking context, and draws the light itself.
 */
export function MeridianStage({ className, transparent = false }: { className?: string; transparent?: boolean }) {
  return (
    <div className={cn(styles.stage, className)} aria-hidden>
      {transparent ? null : <div className={styles.backlight} />}
      {/* the sphere's own box (cobe draws it at 80% of the globe's), for a shader that lights it */}
      <div className={styles.sphere} data-planet />
      <CobeGlobe
        look={transparent ? SEE_THROUGH : LOOK}
        facingLng={-14}
        theta={0.42}
        motion={SWAY}
        grid={GRID}
        arrivals={ARRIVALS}
        farSide={transparent}
        className={styles.globe}
        layerClassName={transparent ? 'mix-blend-lighten' : undefined}
        calloutClassName='max-xl:hidden'
      />
    </div>
  );
}

/** The caption's mark: one arrival, as the globe draws it. */
export function PingGlyph() {
  return (
    <svg className={styles.ping} viewBox='0 0 14 14' aria-hidden>
      <circle cx='7' cy='7' r='5.4' />
      <circle cx='7' cy='7' r='1.9' />
    </svg>
  );
}

/** D2 — the globe, grown up: monochrome and slow, its meridians drawn in, visits pinging in as on the landing. */
export function MeridianVariant(props: VariantProps) {
  const { copy, registration } = props;
  return (
    <div className={styles.root}>
      <MeridianStage />
      <div className={styles.veil} aria-hidden />

      <div className={styles.content}>
        <header>
          <BrandLink />
        </header>

        <main className='flex flex-1 items-center justify-center py-12 max-sm:py-8'>
          <div className={styles.column}>
            <h1 className='text-[2.5rem] leading-[2.75rem] font-medium tracking-[-0.08rem] max-sm:text-[2.125rem] max-sm:leading-10'>
              {copy.welcomeBack}
            </h1>
            <p className='mt-3 text-lede text-muted'>{copy.meridianLede}</p>
            <SignInForm className='mt-10' {...props} order='email-first' oauth='row' />
            <SignUpPrompt copy={copy} registration={registration} className='mt-7' />
          </div>
        </main>

        <footer className='flex flex-wrap items-center gap-x-6 gap-y-2 text-caption text-muted'>
          <Copyright />
          <LegalLinks copy={copy} />
        </footer>
      </div>

      <p className={styles.caption}>
        <PingGlyph />
        {copy.meridianCaption}
      </p>
    </div>
  );
}
