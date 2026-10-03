import { ArrowUpRight } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { env } from '@/lib/env';
import { Section } from '@/landing/components/ui/frame';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { COPY } from '@/landing/content/copy';
import { CUSTOMERS } from '@/landing/content/customers';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import { DemoFrame } from './demoFrame';
import styles from './demoSection.module.css';

const copy = COPY.demo;

export async function DemoSection() {
  const locale = await getLocale();
  const src = env.DEMO_DASHBOARD_ID ? getPathname({ href: `/share/${env.DEMO_DASHBOARD_ID}`, locale }) : null;

  return (
    // hidden on phones (too cramped, costly to load); the nav's Demo link covers them
    <Section
      id={IDS.demo}
      className={cn(
        'z-2 flow-root px-[calc(var(--inset)+8px)] pt-0 max-sm:hidden',
        // the customers row, when shown, hangs right under the window
        CUSTOMERS.length > 0 && 'pb-2 max-lg:pb-2',
      )}
    >
      {/* pull up the window, not the section: a section margin would drag the wall's top rule up */}
      <div className={cn(styles.window, '-mt-(--hero-overlap)')}>
        <div
          className='absolute top-[17px] left-5 z-2 flex gap-[7px] *:size-[9px] *:rounded-full *:bg-rule-22'
          aria-hidden
        >
          <i />
          <i />
          <i />
        </div>
        {src ? (
          <>
            <TrackedLink
              className='absolute top-[9px] left-1/2 z-2 max-w-[40%] -translate-x-1/2 truncate rounded-full border border-rule-10 bg-fg/3 px-[18px] py-1 font-mono text-[11.5px] leading-[18px] text-muted transition-colors duration-180 ease-out-expo hover:border-rule-22 hover:text-fg max-md:max-w-[60%]'
              href='/demo'
              target='_blank'
              rel='noopener'
              placement='demo'
              destination='demo'
            >
              {copy.urlHost}
              <span className='text-fg opacity-86'>{copy.urlPath}</span>
              <ArrowUpRight className='ml-1.5 inline size-3 align-[-1px]' aria-hidden />
              <span className='sr-only'> {copy.newTab}</span>
            </TrackedLink>
            <DemoFrame src={src} />
          </>
        ) : (
          <p className='z-1 mb-3.5 px-6 text-center font-mono text-micro font-bold tracking-[0.16em] text-muted uppercase'>
            {copy.placeholder}
          </p>
        )}
      </div>
    </Section>
  );
}
