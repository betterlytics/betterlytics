import { Panel, Section } from '@/landing/components/ui/frame';
import styles from './faqSection.module.css';

export type FaqItem = { q: string; a: string };

/** Every answer is in the markup, closed or not, and mirrored as FAQPage data for search. */
export function FaqSection({ id, title, items }: { id: string; title: string; items: FaqItem[] }) {
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  return (
    <Section id={id} title={title}>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }}
      />
      <Panel flush framed className='mx-auto max-w-[920px] border-x border-rule transition-ink'>
        {items.map(({ q, a }, i) => (
          <details key={q} className={styles.item} name={`${id}-faq`} open={i === 0}>
            <summary className={styles.question}>
              <h3>{q}</h3>
              <span className={styles.toggle} aria-hidden />
            </summary>
            <p className={styles.answer}>{a}</p>
          </details>
        ))}
      </Panel>
    </Section>
  );
}
