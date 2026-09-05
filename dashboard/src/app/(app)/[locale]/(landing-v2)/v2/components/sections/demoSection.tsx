import { getLocale } from 'next-intl/server';
import { env } from '@/lib/env';
import { Section } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';
import { DemoFrame } from './demoFrame';

/** The embeddable dashboard; falls back to the draft's placeholder when no demo dashboard is configured. */
export async function DemoSection() {
  const locale = await getLocale();
  const src = env.DEMO_DASHBOARD_ID ? `/${locale}/share/${env.DEMO_DASHBOARD_ID}` : null;

  return (
    <Section id={IDS.demo} className='sec--demo'>
      <div className='demo'>
        <div className='demo__dots' aria-hidden>
          <i />
          <i />
          <i />
        </div>
        {src ? (
          <DemoFrame src={src} />
        ) : (
          <div className='demo__mid'>
            <b>{COPY.demo.placeholder}</b>
          </div>
        )}
      </div>
    </Section>
  );
}
