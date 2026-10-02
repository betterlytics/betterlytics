import { Emphasis } from '@/landing/components/ui/emphasis';
import { InView } from '@/landing/components/ui/inView';
import { TEXT_STYLES } from '@/landing/components/ui/text';
import { COPY } from '@/landing/content/copy';
import { FRAMEWORK_GLYPHS } from '@/landing/content/frameworkGlyphs';
import { FRAMEWORKS } from '@/landing/content/frameworks';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './frameworkStrip.module.css';

const copy = COPY.frameworks;

const GLYPHS: ReadonlyArray<{ name: string; path: string; hover?: string }> = FRAMEWORKS.map((framework) => ({
  name: framework.name,
  ...FRAMEWORK_GLYPHS[framework.logo],
}));

/** Monochrome glyphs rather than logo files, so every mark sits at one tone. */
export function FrameworkStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-7 border-t border-rule-08 px-[30px] py-[22px] transition-ink max-sm:px-(--pad)',
        'max-xl:flex-col max-xl:items-start max-xl:gap-4',
        className,
      )}
    >
      <p className={cn(TEXT_STYLES.title, 'flex flex-none flex-col gap-0.5 whitespace-nowrap text-fg')}>
        <span>
          <Emphasis text={copy.title} as='em' className='text-volt-text not-italic' />
        </span>
        <span className='text-[13.5px] leading-5 font-normal tracking-normal whitespace-normal text-muted'>
          {copy.lede}
        </span>
      </p>
      <InView className={styles.glyphs}>
        <ul className={styles.row}>
          {GLYPHS.map((glyph, i) => (
            <li
              key={glyph.name}
              className={styles.glyph}
              title={glyph.name}
              style={vars(glyph.hover ? { '--i': i, '--hover': glyph.hover } : { '--i': i })}
            >
              <svg viewBox='0 0 24 24' width='22' height='22' role='img' aria-label={glyph.name}>
                <path d={glyph.path} fill='currentColor' />
              </svg>
            </li>
          ))}
        </ul>
        <ul className={cn(styles.row, styles.shine)} aria-hidden>
          {GLYPHS.map((glyph) => (
            <li key={glyph.name} className={styles.glyph}>
              <svg viewBox='0 0 24 24' width='22' height='22'>
                <path d={glyph.path} fill='currentColor' />
              </svg>
            </li>
          ))}
        </ul>
      </InView>
    </div>
  );
}
