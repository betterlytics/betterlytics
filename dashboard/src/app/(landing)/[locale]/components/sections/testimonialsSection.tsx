import Image from 'next/image';
import { Emphasis } from '@/landing/components/ui/emphasis';
import { Panel, Section } from '@/landing/components/ui/frame';
import { QUOTE } from '@/landing/content/testimonials';
import { IDS } from '@/landing/lib/ids';

export function TestimonialsSection() {
  const { text, name, role, photo, company, logo } = QUOTE;
  return (
    <Section id={IDS.quotes}>
      <Panel>
        <figure className='mx-auto flex max-w-[54rem] flex-col items-center gap-10 py-16 text-center max-sm:items-start max-sm:gap-8 max-sm:py-10 max-sm:text-left'>
          <blockquote className='text-[2rem] leading-[1.28] font-medium tracking-[-0.03em] text-balance max-lg:text-[1.625rem] max-sm:text-[1.3125rem]'>
            “<Emphasis text={text} as='b' className='font-medium text-volt-soft' />”
          </blockquote>
          <figcaption className='flex items-center gap-5'>
            <Image
              src={photo}
              alt=''
              width={56}
              height={56}
              unoptimized
              className='size-14 flex-none rounded-full border border-rule-22 object-cover'
            />
            <span className='-ml-1.5 text-left'>
              <b className='block text-label font-medium'>{name}</b>
              <span className='text-code text-muted'>{role}</span>
            </span>
            <span className='h-9 w-px bg-rule-22' aria-hidden />
            <Image
              src={logo.src}
              alt={company}
              width={logo.width}
              height={logo.height}
              unoptimized
              className='h-6 w-auto'
            />
          </figcaption>
        </figure>
      </Panel>
    </Section>
  );
}
