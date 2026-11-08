import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LandingFooter } from '@/landing/components/footer/footer';
import { Nav } from '@/landing/components/nav/nav';
import { Band } from '@/landing/components/page/band';
import { BrandMarkDefs } from '@/landing/components/ui/brandMark';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';

export function PageShell({ hero, children, after }: { hero: ReactNode; children: ReactNode; after?: ReactNode }) {
  const t = useTranslations('landing.nav');
  return (
    // clips the 100vw bleed rules (100vw includes a classic scrollbar); not on body, as touch browsers still pan the viewport
    <div className='overflow-x-clip'>
      <BrandMarkDefs />
      <a
        className='absolute -top-20 left-4 z-200 bg-fg px-4 py-2.5 text-label text-canvas transition-[top] duration-200 ease-out-expo focus:top-4'
        href={`#${IDS.main}`}
      >
        {t('skip')}
      </a>
      <div
        className={cn(
          // a page shorter than the window (the blog's 404) grows its band, so the band's rule stays on the footer
          'relative mx-auto flex min-h-svh max-w-[1480px] flex-col',
          'before:pointer-events-none before:absolute before:inset-y-0 before:left-(--pad) before:z-30 before:w-px before:bg-rule max-sm:before:hidden',
          'after:pointer-events-none after:absolute after:inset-y-0 after:right-(--pad) after:z-30 after:w-px after:bg-rule max-sm:after:hidden',
        )}
      >
        <Nav />
        <main id={IDS.main} className='relative flex flex-1 flex-col'>
          {hero ? (
            <div className='relative before:bleed-rule before:top-0 before:z-2 before:bg-rule max-sm:before:hidden'>
              {hero}
            </div>
          ) : null}
          <Band>{children}</Band>
          {after}
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
