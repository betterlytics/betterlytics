import { ArrowUpRight } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { env } from '@/lib/env';
import { DemoFrame } from '@/landing/components/sections/demoFrame';
import { AppWindow, WINDOW_BAR } from '@/landing/components/ui/appWindow';
import { Section } from '@/landing/components/ui/frame';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { cn } from '@/landing/lib/cn';

const HREF = '/demo/monitoring';

/** The live demo dashboard, opened on its first monitor; hidden on phones like the home page's demo. */
export async function MonitorDemo() {
  if (!env.DEMO_DASHBOARD_ID) return null;
  const [locale, t] = await Promise.all([getLocale(), getTranslations('landing.demo')]);

  return (
    <Section id='demo' className='z-2 flow-root px-[calc(var(--inset)+8px)] pt-0 pb-2 max-lg:pb-2 max-sm:hidden'>
      <AppWindow
        className='grid aspect-video place-items-center max-md:aspect-4/3'
        bar={
          <TrackedLink
            className={cn(
              WINDOW_BAR,
              'transition-colors duration-180 ease-out-expo hover:border-rule-22 hover:text-fg',
            )}
            href={HREF}
            target='_blank'
            rel='noopener'
            placement='demo'
            destination='demo'
          >
            betterlytics.io
            <span className='text-fg opacity-86'>{HREF}</span>
            <ArrowUpRight className='ml-1.5 inline size-3 align-[-1px]' aria-hidden />
            <span className='sr-only'> {t('newTab')}</span>
          </TrackedLink>
        }
      >
        <DemoFrame src={getPathname({ href: HREF, locale })} />
      </AppWindow>
    </Section>
  );
}
