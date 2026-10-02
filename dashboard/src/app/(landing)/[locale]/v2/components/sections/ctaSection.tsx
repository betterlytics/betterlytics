import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { TrackedAnchor, TrackedLink } from '@/landing/components/ui/trackedLink';
import { VoltCard, VoltCardActions } from '@/landing/components/ui/voltCard';
import { COPY } from '@/landing/content/copy';
import { LINKS } from '@/landing/lib/links';

const copy = COPY.cta;

export function CtaSection() {
  return (
    <section
      className='relative px-[calc(var(--pad)+12px)] pb-3 after:bleed-rule after:bottom-0 after:z-2 after:bg-rule max-sm:px-0'
      aria-labelledby='cta-title'
    >
      <VoltCard variant='cta'>
        {/* on phones the closing title is set at the hero's scale: 40px is the largest at
            which it still breaks into two lines on a 360px screen */}
        <Heading
          as='h2'
          size='display-2'
          id='cta-title'
          className='max-w-[20ch] text-on-volt max-sm:text-[2.5rem] max-sm:leading-10 max-sm:font-semibold max-sm:tracking-[-0.0625rem]'
        >
          {copy.title}
        </Heading>
        <Lede className='mx-auto -mt-2 max-w-[600px] text-on-volt opacity-84 max-sm:mt-1 max-sm:opacity-100'>
          {copy.lede}
        </Lede>
        <VoltCardActions>
          <TrackedLink
            className={buttonStyles({ variant: 'paper', size: 'lg' })}
            href='/signup'
            placement='cta'
            destination='signup'
          >
            {copy.primary}
          </TrackedLink>
          <TrackedAnchor
            className={buttonStyles({ variant: 'onVolt', size: 'lg' })}
            href={LINKS.docs}
            placement='cta'
            destination='docs'
          >
            {copy.secondary}
          </TrackedAnchor>
        </VoltCardActions>
      </VoltCard>
    </section>
  );
}
