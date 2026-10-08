import { useTranslations } from 'next-intl';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { VoltCard, VoltCardActions } from '@/landing/components/ui/voltCard';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  return (
    <section
      className='relative z-1 px-[calc(var(--pad)+12px)] pt-3 max-sm:px-1 max-sm:pt-1'
      aria-labelledby='hero-title'
    >
      <VoltCard variant='hero'>
        <Heading
          as='h1'
          size='display-1'
          id='hero-title'
          className='mx-auto max-w-[1140px] text-balance text-on-volt max-2xl:max-w-[640px] max-sm:mx-0 max-sm:text-pretty'
        >
          {t('title')}
        </Heading>
        <Lede className='mx-auto -mt-2 max-w-[600px] text-on-volt opacity-86 max-sm:mx-0 max-sm:mt-0 max-sm:text-pretty max-sm:opacity-100'>
          {t('lede')}
        </Lede>
        <VoltCardActions className='max-sm:mt-3'>
          <TrackedLink
            className={buttonStyles({ variant: 'paper', size: 'lg' })}
            href='/signup'
            placement='hero'
            destination='signup'
          >
            {t('cta')}
          </TrackedLink>
        </VoltCardActions>
      </VoltCard>
    </section>
  );
}
