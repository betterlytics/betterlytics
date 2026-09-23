import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { FRAMEWORK_GLYPHS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/frameworkGlyphs';
import { FRAMEWORK_ROWS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/frameworks';

/**
 * The frameworks as a quiet "works with" row: the claim on the left, one
 * monochrome glyph per framework. Glyphs rather than the logo files, so every
 * mark sits at the same tone like the customer wall; each takes its brand
 * colour under the pointer. The compatibility strip cloudflare.com uses under
 * its developer sections, rather than a board.
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
      <ul className='fws__row'>
        {FRAMEWORK_ROWS.flat().map((framework) => {
          const glyph = FRAMEWORK_GLYPHS[framework.logo];
          if (!glyph) return null;
          return (
            <li
              key={framework.name}
              title={framework.name}
              style={glyph.hover ? ({ '--hover': glyph.hover } as CSSProperties) : undefined}
            >
              <svg viewBox='0 0 24 24' width='22' height='22' role='img' aria-label={framework.name}>
                <path d={glyph.path} fill='currentColor' />
              </svg>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
