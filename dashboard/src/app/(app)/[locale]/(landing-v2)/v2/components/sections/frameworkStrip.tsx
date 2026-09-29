import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { InView } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/inView';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { FRAMEWORK_GLYPHS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/frameworkGlyphs';
import { FRAMEWORK_ROWS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/frameworks';

const FRAMEWORKS = FRAMEWORK_ROWS.flat().flatMap((framework) => {
  const glyph = FRAMEWORK_GLYPHS[framework.logo];
  return glyph ? [{ ...framework, ...glyph }] : [];
});

/**
 * The frameworks as a quiet "works with" row: the claim on the left, one
 * monochrome glyph per framework. Glyphs rather than the logo files, so every
 * mark sits at the same tone like the customer wall; each takes its brand
 * colour under the pointer. The compatibility strip cloudflare.com uses under
 * its developer sections, rather than a board. On first sight the marks come
 * in left to right, each passing through its colour before it settles; after
 * that a faint glint drifts across them, a full-tone copy of the row laid on
 * top and masked down to a slow-travelling "/" band.
 */
export function FrameworkStrip({ className }: { className?: string }) {
  return (
    <div className={cn('fws', className)}>
      <p className='fws__lab'>
        <b>
          <Emphasis text={COPY.frameworks.title} wrap={(span) => <em>{span}</em>} />
        </b>
        <span>{COPY.frameworks.lede}</span>
      </p>
      <InView className='fws__glyphs'>
        <ul className='fws__row'>
          {FRAMEWORKS.map((framework, i) => (
            <li
              key={framework.name}
              title={framework.name}
              style={{ '--i': i, '--hover': framework.hover } as CSSProperties}
            >
              <svg viewBox='0 0 24 24' width='22' height='22' role='img' aria-label={framework.name}>
                <path d={framework.path} fill='currentColor' />
              </svg>
            </li>
          ))}
        </ul>
        <ul className='fws__row fws__shine' aria-hidden>
          {FRAMEWORKS.map((framework) => (
            <li key={framework.name}>
              <svg viewBox='0 0 24 24' width='22' height='22'>
                <path d={framework.path} fill='currentColor' />
              </svg>
            </li>
          ))}
        </ul>
      </InView>
    </div>
  );
}
