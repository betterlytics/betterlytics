import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Emphasis } from '@/landing/components/ui/emphasis';
import { Panel, Section } from '@/landing/components/ui/frame';
import { COPY } from '@/landing/content/copy';
import { TESTIMONIAL_ROWS, type Testimonial } from '@/landing/content/testimonials';
import { IDS } from '@/landing/lib/ids';

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
          {t.avatar ? (
            <Image src={`/images/testimonials/${t.avatar}`} alt='' width={38} height={38} unoptimized />
          ) : (
            initials(t.name)
          )}
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
    <Section id={IDS.quotes} title={COPY.quotes.title} lede={COPY.quotes.lede}>
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
