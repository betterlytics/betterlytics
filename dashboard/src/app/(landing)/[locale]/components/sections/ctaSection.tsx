import { useTranslations } from 'next-intl';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { TrackedAnchor, TrackedLink } from '@/landing/components/ui/trackedLink';
import { VoltCard, VoltCardActions } from '@/landing/components/ui/voltCard';
import type { CtaDestination } from '@/landing/lib/analytics';
import { cn } from '@/landing/lib/cn';
import { LINKS } from '@/landing/lib/links';

type CtaCopy = {
  title: string;
  lede: string;
  primary: string;
  secondary: string;
  secondaryHref?: string;
  secondaryDestination?: CtaDestination;
};

export function CtaSection({ copy }: { copy?: CtaCopy }) {
  const t = useTranslations('landing.cta');
  const {
    title,
    lede,
    primary,
    secondary,
    secondaryHref,
    secondaryDestination = 'docs',
  } = copy ?? {
    title: t('title'),
    lede: t('lede'),
    primary: t('primary'),
    secondary: t('secondary'),
  };
  return (
    // phone hatch band mirrors the one in pricingSection
    <section
      className={cn(
        'relative px-[calc(var(--pad)+12px)] pb-3 after:bleed-rule after:bottom-0 after:z-2 after:bg-rule max-sm:px-0',
        'max-sm:pb-[61px] max-sm:before:absolute max-sm:before:inset-x-0 max-sm:before:bottom-0 max-sm:before:h-[49px] max-sm:before:border-t max-sm:before:border-rule max-sm:before:bg-hatch',
      )}
      aria-labelledby='cta-title'
    >
      <VoltCard variant='cta'>
        {/* 40px on phones: the largest size that still fits two lines at 360px */}
        <Heading
          as='h2'
          size='display-2'
          id='cta-title'
          className='max-w-[20ch] text-balance text-on-volt max-sm:text-[2.5rem] max-sm:leading-10 max-sm:font-semibold max-sm:tracking-[-0.0625rem]'
        >
          {title}
        </Heading>
        <Lede className='mx-auto -mt-2 max-w-[600px] text-on-volt opacity-84 max-sm:mt-1 max-sm:opacity-100'>
          {lede}
        </Lede>
        <VoltCardActions>
          <TrackedLink
            className={buttonStyles({ variant: 'paper', size: 'lg' })}
            href='/signup'
            placement='cta'
            destination='signup'
          >
            {primary}
          </TrackedLink>
          <TrackedAnchor
            className={buttonStyles({ variant: 'onVolt', size: 'lg' })}
            href={secondaryHref ?? LINKS.docs}
            placement='cta'
            destination={secondaryDestination}
          >
            {secondary}
          </TrackedAnchor>
        </VoltCardActions>
      </VoltCard>
    </section>
  );
}
