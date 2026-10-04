import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { EuSeal } from '@/landing/components/illustrations/euSeal';
import { CountUp } from '@/landing/components/ui/countUp';
import { Panel, Section } from '@/landing/components/ui/frame';
import { Reveal } from '@/landing/components/ui/reveal';
import { Label } from '@/landing/components/ui/text';
import { SHOW_QUOTE } from '@/landing/content/testimonials';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import { FrameworkStrip } from './frameworkStrip';
import styles from './networkSection.module.css';
import { SnippetPanel } from './snippetPanel';

/* size: static/analytics.js as served, gzipped; bots: per-site median of pageviews filtered as bots in prod (21.6%, 30 days to 2026-10-04) */
const STATS = [
  { key: 'size', value: 3.5, decimals: 1, unit: 'kB' },
  { key: 'bots', value: 20, decimals: 0, unit: '%' },
  { key: 'openSource', value: 100, decimals: 0, unit: '%' },
] as const;

const FIGURE = 'text-[30px] leading-8 font-medium tracking-[-1px] tabular-nums';

/** Reveals inside its row, which carries the rules: the lift and ink transitions can't share an element. */
function Stat({
  index,
  figure,
  label,
  body,
  lit = false,
}: {
  index: number;
  figure: ReactNode;
  label: string;
  body: string;
  lit?: boolean;
}) {
  return (
    <Reveal index={index} className={cn('grid grid-cols-[108px_1fr] items-start gap-4.5', lit && 'relative z-1')}>
      <div className='flex items-baseline gap-[5px]'>{figure}</div>
      <div>
        <Label className={cn('font-medium', lit ? 'text-on-volt' : 'text-fg')}>{label}</Label>
        <p className={cn('mt-1 text-label leading-[21px]', lit ? 'text-on-volt opacity-82' : 'text-muted')}>
          {body}
        </p>
      </div>
    </Reveal>
  );
}

export function NetworkSection() {
  const t = useTranslations('landing.network');
  return (
    // the quote panel (testimonialsSection), when shown, hangs off this panel's bottom rule
    <Section id={IDS.network} title={t('title')} lede={t('lede')} className={cn(SHOW_QUOTE && 'pb-0 max-lg:pb-0')}>
      <Panel flush>
        {/* min-w-0 lets the snippet column narrow past its tab bar (which scrolls); phones bleed to the screen edge */}
        <div className='grid grid-cols-[1.55fr_1fr] max-xl:grid-cols-1 max-sm:-mx-(--pad)'>
          <div className='flex min-w-0 border-r border-rule-08 bg-hatch p-4.5 transition-ink max-xl:border-r-0 max-xl:border-b max-sm:px-1'>
            <SnippetPanel />
          </div>
          <div className={styles.stats}>
            {STATS.map((stat, i) => (
              <div key={stat.key} className={cn(styles.row, 'transition-ink')}>
                <Stat
                  index={i}
                  figure={
                    <>
                      <CountUp className={FIGURE} value={stat.value} decimals={stat.decimals} />
                      <span className='text-[19px] tracking-[-0.3px] text-muted'>{stat.unit}</span>
                    </>
                  }
                  label={t(`stats.${stat.key}.label`)}
                  body={t(`stats.${stat.key}.body`)}
                />
              </div>
            ))}
            {/* clip, not hidden: a scroll container could shrink below its text */}
            <div className={cn(styles.row, 'group relative overflow-clip bg-volt text-on-volt')}>
              <EuSeal />
              <Stat
                lit
                index={STATS.length}
                figure={<b className={FIGURE}>0</b>}
                label={t('thesis.label')}
                body={t('thesis.body')}
              />
            </div>
          </div>
          <FrameworkStrip className='col-span-full' />
        </div>
      </Panel>
    </Section>
  );
}
