import { ArrowUpRight } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { env } from '@/lib/env';
import { AppWindow, WINDOW_BAR } from '@/landing/components/ui/appWindow';
import { Section } from '@/landing/components/ui/frame';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { CUSTOMERS } from '@/landing/content/customers';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import { DemoFrame } from './demoFrame';

const URL_HOST = 'betterlytics.io';

type DemoSectionProps = { href?: string; src?: string; className?: string };

export async function DemoSection({ href = '/demo', src, className }: DemoSectionProps) {
  if (!env.DEMO_DASHBOARD_ID) return null;
  const [locale, t] = await Promise.all([getLocale(), getTranslations('landing.demo')]);
  const frameSrc = getPathname({ href: src ?? `/share/${env.DEMO_DASHBOARD_ID}`, locale });

  return (
    // hidden on phones (too cramped, costly to load); the nav's Demo link covers them
    <Section
      id={IDS.demo}
      className={cn(
        'z-2 flow-root px-[calc(var(--inset)+8px)] pt-0 max-sm:hidden',
        CUSTOMERS.length > 0 && 'pb-2 max-lg:pb-2',
        className,
      )}
    >
      {/* pull up the window, not the section: a section margin would drag the wall's top rule up */}
      <AppWindow
        className='grid aspect-video place-items-center max-md:aspect-4/3'
        bar={
          <TrackedLink
            className={cn(
              WINDOW_BAR,
              'transition-colors duration-180 ease-out-expo hover:border-rule-22 hover:text-fg',
            )}
            href={href}
            target='_blank'
            rel='noopener'
            placement='demo'
            destination='demo'
          >
            {URL_HOST}
            <span className='text-fg opacity-86'>{href}</span>
            <ArrowUpRight className='ml-1.5 inline size-3 align-[-1px]' aria-hidden />
            <span className='sr-only'> {t('newTab')}</span>
          </TrackedLink>
        }
      >
        <DemoFrame src={frameSrc} href={href} />
      </AppWindow>
    </Section>
  );
}
