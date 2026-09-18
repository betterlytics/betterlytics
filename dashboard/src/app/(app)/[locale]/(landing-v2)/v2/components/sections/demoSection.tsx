import { getLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { env } from '@/lib/env';
import { Section } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';
import { DemoFrame } from './demoFrame';

/** The embeddable dashboard; falls back to the draft's placeholder when no demo dashboard is configured. */
export async function DemoSection() {
  const locale = await getLocale();
  const src = env.DEMO_DASHBOARD_ID ? getPathname({ href: `/share/${env.DEMO_DASHBOARD_ID}`, locale }) : null;

  return (
    <Section id={IDS.demo} className='sec--demo'>
      <div className='demo'>
        <div className='demo__dots' aria-hidden>
          <i />
          <i />
          <i />
        </div>
        {/* The dots alone read as a screenshot. The stub address bar names the
            thing as a demo and the tag says its numbers are moving; both are
            chrome, so they are hidden from assistive tech — the frame's title
            and the scrim carry the same meaning in text. */}
        {src && (
          <>
            <p className='demo__url' aria-hidden>
              {COPY.demo.urlHost}
              <span>{COPY.demo.urlPath}</span>
            </p>
            <p className='demo__tag' aria-hidden>
              <i />
              {COPY.demo.tag}
            </p>
          </>
        )}
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
