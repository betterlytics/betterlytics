import { cn } from '@/lib/utils';
import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { Panel, Section, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { TESTIMONIAL_ROWS, type Testimonial } from '@/app/(app)/[locale]/(landing-v2)/v2/content/testimonials';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className={cn('tst', t.volt && 'tst--volt')}>
      <blockquote>
        <Emphasis text={t.quote} wrap={(span) => <b>{span}</b>} />
      </blockquote>
      <figcaption>
        <span className='tst__av' aria-hidden>
          {initials(t.name)}
        </span>
        <span className='tst__who'>
          <b>{t.name}</b>
          <span>{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Cards, deliberately unlike the framework tiles: slower and larger, so the two rows never read as the same device. */
export function TestimonialsSection() {
  return (
    <Section id={IDS.quotes}>
      <SectionHead title={COPY.quotes.title} />
      <Panel flush>
        <div className='tsts'>
          {TESTIMONIAL_ROWS.map((row, r) => (
            <div key={r} className='tst__row'>
              {row.map((t) => (
                <Card key={t.name} t={t} />
              ))}
              <span aria-hidden style={{ display: 'contents' }}>
                {row.map((t) => (
                  <Card key={t.name} t={t} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  );
}
