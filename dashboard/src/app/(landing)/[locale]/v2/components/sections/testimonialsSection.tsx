import Image from 'next/image';
import { Emphasis } from '@/landing/components/ui/emphasis';
import { Panel, Section } from '@/landing/components/ui/frame';
import { COPY } from '@/landing/content/copy';
import { TESTIMONIAL_ROWS, type Testimonial } from '@/landing/content/testimonials';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import styles from './testimonialsSection.module.css';
import { TestimonialsMarquee } from './testimonialsMarquee';

/** A card's two tones: the canvas surface, or the brand colour a row's standout quote is set in. */
const TONES = {
  surface: {
    card: '',
    quote: 'opacity-90',
    emphasis: 'font-normal text-volt-soft',
    avatar: 'border-rule-08 bg-fg/7 text-muted',
    role: 'text-muted',
  },
  volt: {
    card: cn(styles.volt, 'text-on-volt'),
    quote: 'opacity-95',
    emphasis: 'font-medium',
    avatar: 'border-on-volt/28 bg-on-volt/16',
    role: 'opacity-72',
  },
} as const;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** `repeat` marks the second pass that closes the marquee's loop, which screen readers skip. */
function Card({ testimonial, repeat = false }: { testimonial: Testimonial; repeat?: boolean }) {
  const { quote, name, role, avatar, volt } = testimonial;
  const tone = TONES[volt ? 'volt' : 'surface'];
  return (
    <figure
      className={cn(styles.card, tone.card, 'flex w-98 flex-none flex-col gap-5.5 p-6.5 max-sm:w-75')}
      aria-hidden={repeat || undefined}
    >
      <blockquote className={cn('text-body leading-[1.62] tracking-[-0.1px]', tone.quote)}>
        <Emphasis text={quote} wrap={(span) => <b className={tone.emphasis}>{span}</b>} />
      </blockquote>
      <figcaption className='mt-auto flex items-center gap-3'>
        <span
          className={cn(
            'grid size-9.5 flex-none place-items-center overflow-hidden rounded-full border font-mono text-micro tracking-[0.04em]',
            tone.avatar,
          )}
          aria-hidden
        >
          {avatar ? (
            <Image
              className='size-full object-cover'
              src={`/images/testimonials/${avatar}`}
              alt=''
              width={38}
              height={38}
              unoptimized
            />
          ) : (
            initials(name)
          )}
        </span>
        <span>
          <b className='block text-label font-medium tracking-[-0.1px]'>{name}</b>
          <span className={cn('text-code', tone.role)}>{role}</span>
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
        <TestimonialsMarquee>
          {TESTIMONIAL_ROWS.map((row, r) => (
            <div key={r} className={styles.row}>
              {row.map((testimonial) => (
                <Card key={testimonial.name} testimonial={testimonial} />
              ))}
              {row.map((testimonial) => (
                <Card key={`${testimonial.name} (repeat)`} testimonial={testimonial} repeat />
              ))}
            </div>
          ))}
        </TestimonialsMarquee>
      </Panel>
    </Section>
  );
}
