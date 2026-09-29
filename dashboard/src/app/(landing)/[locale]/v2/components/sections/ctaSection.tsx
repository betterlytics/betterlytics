import { Link } from '@/i18n/navigation';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { VoltCard } from '@/landing/components/ui/voltCard';
import { COPY } from '@/landing/content/copy';
import { LINKS } from '@/landing/lib/links';

const copy = COPY.cta;

export function CtaSection() {
  return (
    <section
      className='relative px-[calc(var(--pad)+12px)] pb-3 after:bleed-rule after:bottom-0 after:z-2 after:bg-rule'
      aria-labelledby='cta-title'
    >
      <VoltCard variant='cta'>
        <Heading as='h2' size='display-2' id='cta-title' className='max-w-[20ch] text-on-volt'>
          {copy.title}
        </Heading>
        <Lede className='mx-auto -mt-2 max-w-[600px] text-on-volt opacity-84'>{copy.lede}</Lede>
        <div className='mt-1.5 flex flex-wrap justify-center gap-2.5'>
          <Link className={buttonStyles({ variant: 'paper', size: 'lg' })} href='/signup'>
            {copy.primary}
          </Link>
          <a className={buttonStyles({ variant: 'onVolt', size: 'lg' })} href={LINKS.docs}>
            {copy.secondary}
          </a>
        </div>
      </VoltCard>
    </section>
  );
}
