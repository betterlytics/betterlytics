import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { VoltCard, VoltCardActions } from '@/landing/components/ui/voltCard';
import { COPY } from '@/landing/content/copy';

const copy = COPY.hero;

export function HeroSection() {
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
          className='mx-auto max-w-[1140px] text-balance text-on-volt max-2xl:max-w-[640px]'
        >
          {copy.title}
        </Heading>
        <Lede className='mx-auto -mt-2 max-w-[600px] text-on-volt opacity-86 max-sm:mt-0 max-sm:opacity-100'>
          {copy.lede}
        </Lede>
        <VoltCardActions className='max-sm:mt-3'>
          <TrackedLink
            className={buttonStyles({ variant: 'paper', size: 'lg' })}
            href='/signup'
            placement='hero'
            destination='signup'
          >
            {copy.ctaPrimary}
          </TrackedLink>
        </VoltCardActions>
      </VoltCard>
    </section>
  );
}
