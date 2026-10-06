import { BrandLink } from '@/landing/components/ui/brandMark';
import type { VariantProps } from '@/landing/signin/_auth/types';
import { LineworkPanel } from './linework';
import { MeridianStage, PingGlyph } from './meridian';
import { Copyright, LegalLinks } from './shared';
import { SpaceShader } from './spaceShader';
import styles from './atlas.module.css';

/* the light sits behind the planet's upper-left limb, towards the form */
const SUN: [number, number] = [-0.62, -0.78];

/**
 * D3 — Meridian's globe beside Linework's inked panel. A shader draws the page: its own colour, the planet's air and
 * the light behind it; the globe is see-through, as on the landing, so the construction lines run on through it.
 */
export function AtlasVariant(props: VariantProps) {
  const { copy } = props;
  return (
    <div className={styles.root}>
      <SpaceShader className={styles.sky} space={false} sun={SUN} seeThrough />

      <header className={styles.top}>
        <BrandLink compact />
      </header>

      <main className={styles.middle}>
        <div className={styles.cell}>
          <LineworkPanel {...props} className={styles.panel} />
        </div>
      </main>

      <footer className={styles.bottom}>
        <div className='flex flex-wrap items-center gap-x-6 gap-y-1.5 max-sm:justify-center'>
          <Copyright className='font-mono text-code text-muted' />
          <LegalLinks copy={copy} className='font-mono text-code' />
        </div>
        <p className={styles.caption}>
          <PingGlyph />
          {copy.meridianCaption}
        </p>
      </footer>

      {/* after the page, so its blend sees the lines under it */}
      <MeridianStage className={styles.stage} transparent />
      <div className={styles.veil} aria-hidden />
    </div>
  );
}
