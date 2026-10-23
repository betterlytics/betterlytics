import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SnippetPanel, type FootPart } from '@/landing/components/sections/snippetPanel';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { SRC, type Snippet } from '@/landing/content/snippets';
import { LINKS } from '@/landing/lib/links';

const STEPS = ['enable', 'consent', 'tune'] as const;

const FOOT: readonly FootPart[] = [
  { text: 'GET' },
  { text: '/replay.js', ink: true },
  { text: '200', ink: true },
  { text: 'lazy' },
];

export function SetupPanel() {
  const t = useTranslations('landing.replay.setup');
  const snippets: Snippet[] = [
    {
      id: 'html',
      name: 'HTML',
      file: 'index.html',
      logo: 'html',
      code: `<script async
  src="${SRC}"
  data-site-id="YOUR_SITE_ID"
+  data-replay="true"
+  data-replay-sample="20"
+  data-disable-replay-on-urls="/admin/**"
+  data-track-errors="true"
+  data-replay-on-error="true">
</script>`,
    },
    {
      id: 'package',
      file: 'src/analytics.ts',
      code: `import betterlytics from '@betterlytics/tracker'

betterlytics.init('YOUR_SITE_ID', {
+  enableSessionReplay: true,
+  replaySample: 20,
+  disableReplayOnUrls: ['/admin/**'],
})`,
    },
    {
      id: 'consent',
      name: t('consentTab'),
      file: 'consent.js',
      glyph: <ShieldCheck className='size-[13px] opacity-80' aria-hidden />,
      code: `// when your consent banner resolves
+window.betterlytics?.setReplayConsent(true)

// if the visitor changes their mind
+window.betterlytics?.setReplayConsent(false)

// no consent needed? set data-consent-replay="true" on the script tag instead`,
    },
  ];
  return (
    <div className='grid grid-cols-[1fr_1.15fr] max-lg:grid-cols-1'>
      <div className='flex flex-col border-r border-rule-10 px-7.5 pt-8 pb-8 transition-ink max-lg:border-r-0 max-lg:border-b max-sm:px-6'>
        <ol className='grid gap-6'>
          {STEPS.map((key, i) => (
            <li key={key} className='grid grid-cols-[28px_1fr] gap-3.5'>
              <span className='grid size-7 place-items-center rounded-full border border-rule-22 text-caption text-fg tabular-nums'>
                {i + 1}
              </span>
              <div>
                <Heading as='h3' size='title' className='mb-1.5 leading-7'>
                  {t(`steps.${key}.title`)}
                </Heading>
                <p
                  className='text-body leading-[23px] text-muted'
                  data-cursor-consent={key === 'consent' || undefined}
                >
                  {t(`steps.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className='mt-auto pt-8'>
          <TrackedAnchor
            className={buttonStyles({ variant: 'line', size: 'sm' })}
            href={LINKS.replayDocs}
            placement='setup'
            destination='docs'
          >
            {t('cta')}
          </TrackedAnchor>
        </div>
      </div>
      <div className='flex min-w-0 bg-hatch p-4.5 max-sm:p-0'>
        <SnippetPanel snippets={snippets} label={t('snippetLabel')} foot={FOOT} />
      </div>
    </div>
  );
}
