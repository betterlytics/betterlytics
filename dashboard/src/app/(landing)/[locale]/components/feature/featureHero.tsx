import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppLink } from '@/landing/components/ui/appLink';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { TrackedAnchor, TrackedLink } from '@/landing/components/ui/trackedLink';
import { VoltCard, VoltCardActions } from '@/landing/components/ui/voltCard';

type FeatureHeroProps = {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  lede: string;
  primary: string;
  secondary: { label: string; href: string };
  /** A quiet line under the buttons, e.g. a link to the feature running live. */
  note?: ReactNode;
};

/** The feature name is the eyebrow, never the headline: the headline sells what it does. */
export function FeatureHero({ icon, eyebrow, title, lede, primary, secondary, note }: FeatureHeroProps) {
  const t = useTranslations('landing.feature');
  return (
    <section
      className='relative z-1 px-[calc(var(--pad)+12px)] pt-3 max-sm:px-1 max-sm:pt-1'
      aria-labelledby='hero-title'
    >
      <VoltCard variant='hero'>
        <nav aria-label={t('breadcrumb')} className='-mb-2 max-sm:mb-0'>
          <ol className='flex items-center gap-1.5 text-label text-on-volt'>
            <li>
              <AppLink
                href='/features'
                className='opacity-72 transition-opacity duration-180 ease-out-expo hover:opacity-100'
              >
                {t('features')}
              </AppLink>
            </li>
            <li aria-hidden className='opacity-50'>
              <ChevronRight className='size-3.5' />
            </li>
            <li>
              <span
                aria-current='page'
                className='inline-flex items-center gap-2 rounded-full border border-on-volt/25 bg-on-volt/10 py-1 pr-3.5 pl-1.5 font-medium shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]'
              >
                <span className='grid size-5.5 place-items-center rounded-full bg-on-volt text-volt'>{icon}</span>
                {eyebrow}
              </span>
            </li>
          </ol>
        </nav>
        <Heading
          as='h1'
          size='display-1'
          id='hero-title'
          className='mx-auto max-w-[980px] text-balance text-on-volt max-2xl:max-w-[700px] max-sm:mx-0 max-sm:text-pretty'
        >
          {title}
        </Heading>
        <Lede className='mx-auto -mt-2 max-w-[600px] text-on-volt opacity-86 max-sm:mx-0 max-sm:mt-0 max-sm:text-pretty max-sm:opacity-100'>
          {lede}
        </Lede>
        <VoltCardActions className='max-sm:mt-3'>
          <TrackedLink
            className={buttonStyles({ variant: 'paper', size: 'lg' })}
            href='/signup'
            placement='hero'
            destination='signup'
          >
            {primary}
          </TrackedLink>
          <TrackedAnchor
            className={buttonStyles({ variant: 'onVolt', size: 'lg' })}
            href={secondary.href}
            placement='hero'
            destination='docs'
          >
            {secondary.label}
          </TrackedAnchor>
        </VoltCardActions>
        {note}
      </VoltCard>
    </section>
  );
}
