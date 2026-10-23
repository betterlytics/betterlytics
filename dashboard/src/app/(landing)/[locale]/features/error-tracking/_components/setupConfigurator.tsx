'use client';

import { useId, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SnippetPanel } from '@/landing/components/sections/snippetPanel';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { SRC, type Snippet } from '@/landing/content/snippets';
import { LINKS } from '@/landing/lib/links';
import styles from './setupConfigurator.module.css';

type Option = 'console' | 'replay';

/** `attr` and `npm` are the tracker's real names; the attribute list closes the tag, so the last one carries `>`. */
const OPTIONS = {
  console: { attr: 'data-track-console-errors', npm: 'trackConsoleErrors' },
  replay: { attr: 'data-replay-on-error', npm: 'replayOnError' },
} as const satisfies Record<Option, { attr: string; npm: string }>;

/** Replay only records visitors who consented, so turning it on adds the consent call as its own tab. */
function buildSnippets(on: Record<Option, boolean>, consentTab: string): Snippet[] {
  const picked = (Object.keys(OPTIONS) as Option[]).filter((key) => on[key]);
  const attrs = ['data-track-errors', ...picked.map((key) => OPTIONS[key].attr)];
  const npm = ['trackErrors', ...picked.map((key) => OPTIONS[key].npm)];
  return [
    {
      id: 'html',
      name: 'HTML',
      file: 'index.html',
      logo: 'html',
      code: [
        '<script async',
        `  src="${SRC}"`,
        '  data-site-id="YOUR_SITE_ID"',
        ...attrs.map((attr, i) => `+  ${attr}="true"${i === attrs.length - 1 ? '>' : ''}`),
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
        ...npm.map((name) => `+  ${name}: true,`),
        '})',
      ].join('\n'),
    },
    ...(on.replay
      ? [
          {
            id: 'consent',
            name: consentTab,
            file: 'consent.js',
            glyph: <ShieldCheck className='size-[13px] opacity-80' aria-hidden />,
            code: `// when your consent banner resolves
+window.betterlytics?.setReplayConsent(true)`,
          },
        ]
      : []),
  ];
}

export function SetupConfigurator() {
  const t = useTranslations('landing.errors.setup');
  const [on, setOn] = useState<Record<Option, boolean>>({ console: false, replay: false });
  const id = useId();
  const toggle = (key: Option) => setOn((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className='grid grid-cols-[1fr_1.15fr] max-lg:grid-cols-1'>
      <div className='flex flex-col border-r border-rule-10 px-7.5 pt-8 pb-8 transition-ink max-lg:border-r-0 max-lg:border-b max-sm:px-6'>
        <Heading as='h3' size='title' className='mb-5'>
          {t('lead')}
        </Heading>
        <ul className={styles.options}>
          <li className={styles.option} data-on data-locked>
            <span className={styles.text}>
              <b>{t('options.errors.title')}</b>
              <span>{t('options.errors.body')}</span>
            </span>
            <span className={styles.always}>{t('always')}</span>
          </li>
          {(Object.keys(OPTIONS) as Option[]).map((key) => (
            <li key={key}>
              <button
                type='button'
                role='switch'
                aria-checked={on[key]}
                aria-labelledby={`${id}-${key}-title`}
                aria-describedby={`${id}-${key}-body`}
                className={styles.option}
                data-on={on[key] || undefined}
                onClick={() => toggle(key)}
              >
                <span className={styles.text}>
                  <b id={`${id}-${key}-title`}>{t(`options.${key}.title`)}</b>
                  <span id={`${id}-${key}-body`}>{t(`options.${key}.body`)}</span>
                </span>
                <span className={styles.switch} aria-hidden>
                  <i />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className='mt-auto pt-8'>
          <TrackedAnchor
            className={buttonStyles({ variant: 'line', size: 'sm' })}
            href={LINKS.errorsDocs}
            placement='setup'
            destination='docs'
          >
            {t('cta')}
          </TrackedAnchor>
        </div>
      </div>
      <div className='flex min-w-0 bg-hatch p-4.5 max-sm:p-0'>
        <SnippetPanel snippets={buildSnippets(on, t('consentTab'))} label={t('snippetLabel')} />
      </div>
    </div>
  );
}
