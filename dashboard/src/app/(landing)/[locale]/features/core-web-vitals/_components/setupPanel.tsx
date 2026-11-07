import { useTranslations } from 'next-intl';
import { SnippetPanel, type FootPart } from '@/landing/components/sections/snippetPanel';
import { buttonStyles } from '@/landing/components/ui/button';
import { InView } from '@/landing/components/ui/inView';
import { Heading } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { SRC, type Snippet } from '@/landing/content/snippets';
import { vars } from '@/landing/lib/cssVars';
import { LINKS } from '@/landing/lib/links';
import styles from './setupPanel.module.css';

const SNIPPETS: Snippet[] = [
  {
    id: 'html',
    name: 'HTML',
    file: 'index.html',
    logo: 'html',
    code: [
      '<script async',
      `  src="${SRC}"`,
      '  data-site-id="YOUR_SITE_ID"',
      '+  data-web-vitals="true">',
      '</script>',
    ].join('\n'),
  },
  {
    id: 'package',
    file: 'src/analytics.ts',
    code: [
      "import betterlytics from '@betterlytics/tracker'",
      '',
      "betterlytics.init('YOUR_SITE_ID', {",
      '+  enableWebVitals: true,',
      '})',
    ].join('\n'),
  },
];

const FOOT: FootPart[] = [
  { text: 'GET' },
  { text: '/web-vitals.js', ink: true },
  { text: '200', ink: true },
  { text: 'async' },
];

/** Bars as fractions of the track: the page loads, then the gap stands for the visit until the visitor leaves. */
const ROWS = [
  { key: 'page', from: 0, to: 0.46 },
  { key: 'analytics', request: 'analytics.js', from: 0.1, to: 0.19 },
  { key: 'vitals', request: 'web-vitals.js', from: 0.19, to: 0.25, note: true },
  { key: 'event', request: 'POST /event', from: 0.9, to: 0.94, note: true },
] as const;

export function SetupPanel() {
  const t = useTranslations('landing.vitals.setup');
  return (
    <div className='grid grid-cols-[1fr_1.1fr] max-lg:grid-cols-1'>
      <div className='flex flex-col border-r border-rule-10 px-7.5 pt-8 pb-8 transition-ink max-lg:border-r-0 max-lg:border-b max-sm:px-(--pad)'>
        <Heading as='h3' size='title' className='mb-6'>
          {t('lead')}
        </Heading>
        <InView className={styles.waterfall} aria-hidden>
          <span className={styles.gap} />
          {ROWS.map((row, i) => (
            <div key={row.key} className={styles.row} data-row={row.key}>
              <span className={styles.label} data-request={'request' in row || undefined}>
                {'request' in row ? row.request : t('page')}
              </span>
              <span className={styles.track}>
                <i style={vars({ '--from': row.from, '--to': row.to, '--i': i })} />
              </span>
              {'note' in row && <span className={styles.note}>{t(`notes.${row.key as 'vitals' | 'event'}`)}</span>}
            </div>
          ))}
        </InView>
        <p className='sr-only'>{`${t('notes.vitals')}. ${t('notes.event')}.`}</p>
        <div className='mt-auto pt-8'>
          <TrackedAnchor
            className={buttonStyles({ variant: 'line', size: 'sm' })}
            href={LINKS.vitalsDocs}
            placement='setup'
            destination='docs'
          >
            {t('cta')}
          </TrackedAnchor>
        </div>
      </div>
      <div className='flex min-w-0 bg-hatch p-4.5 max-sm:p-0'>
        <SnippetPanel snippets={SNIPPETS} label={t('snippetLabel')} foot={FOOT} />
      </div>
    </div>
  );
}
