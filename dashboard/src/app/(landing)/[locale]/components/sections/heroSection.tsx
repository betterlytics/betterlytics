import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppLink } from '@/landing/components/ui/appLink';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { TrackedAnchor, TrackedLink } from '@/landing/components/ui/trackedLink';
import { VoltCard, VoltCardActions } from '@/landing/components/ui/voltCard';
import { cn } from '@/landing/lib/cn';

type HeroCopy = { title: string; lede: string; primary: string; secondary?: { label: string; href: string } };

type HeroSectionProps = {
  copy?: HeroCopy;
  breadcrumb?: { icon: ReactNode; label: string };
  note?: ReactNode;
  titleClassName?: string;
};

export function HeroSection({ copy, breadcrumb, note, titleClassName }: HeroSectionProps) {
  const t = useTranslations('landing.hero');
  const tFeature = useTranslations('landing.feature');
  const { title, lede, primary, secondary } = copy ?? { title: t('title'), lede: t('lede'), primary: t('cta') };
  return (
    <section
      className='relative z-1 px-[calc(var(--pad)+12px)] pt-3 max-sm:px-1 max-sm:pt-1'
      aria-labelledby='hero-title'
    >
      <VoltCard variant='hero'>
        {breadcrumb && (
          <nav aria-label={tFeature('breadcrumb')} className='-mb-2 max-sm:mb-0'>
            <ol className='flex items-center gap-1.5 text-label text-on-volt'>
              <li>
                <AppLink
                  href='/features'
                  className='opacity-72 transition-opacity duration-180 ease-out-expo hover:opacity-100'
                >
                  {tFeature('features')}
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
                  <span className='grid size-5.5 place-items-center rounded-full bg-on-volt text-volt'>
                    {breadcrumb.icon}
                  </span>
                  {breadcrumb.label}
                </span>
              </li>
            </ol>
          </nav>
        )}
        <Heading
          as='h1'
          size='display-1'
          id='hero-title'
          className={cn(
            'mx-auto max-w-[1140px] text-balance text-on-volt max-2xl:max-w-[640px] max-sm:mx-0 max-sm:text-pretty',
            titleClassName,
          )}
        >
          {breadcrumb && <span className='sr-only'>{breadcrumb.label}: </span>}
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
          {secondary && (
            <TrackedAnchor
              className={buttonStyles({ variant: 'onVolt', size: 'lg' })}
              href={secondary.href}
              placement='hero'
              destination='docs'
            >
              {secondary.label}
            </TrackedAnchor>
          )}
        </VoltCardActions>
        {note}
      </VoltCard>
    </section>
  );
}
