import type { ReactNode } from 'react';
import { EuSeal } from '@/landing/components/illustrations/euSeal';
import { CountUp } from '@/landing/components/ui/countUp';
import { Panel, Section } from '@/landing/components/ui/frame';
import { Reveal } from '@/landing/components/ui/reveal';
import { Label } from '@/landing/components/ui/text';
import { COPY } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import { FrameworkStrip } from './frameworkStrip';
import styles from './networkSection.module.css';
import { SnippetPanel } from './snippetPanel';

const copy = COPY.network;

const FIGURE = 'text-[30px] leading-8 font-medium tracking-[-1px] tabular-nums';

/**
 * A stat's figure, then its name and what it means. It lifts in inside its row,
 * which carries the rules, so they can ink in with the frame meanwhile (the two
 * transitions can't share an element). `lit` sets it on the volt.
 */
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
        {/* under a number the label is its name, so it takes full ink and the body stays muted */}
        <Label className={cn('font-medium', lit ? 'text-on-volt' : 'text-fg')}>{label}</Label>
        <p className={cn('mt-1 text-label leading-[21px]', lit ? 'text-on-volt opacity-82' : 'text-muted')}>
          {body}
        </p>
      </div>
    </Reveal>
  );
}

/**
 * The "one script" section, after cloudflare.com's code-example split: the
 * install snippet on hatched paper with a tab per framework, beside a stack of
 * rows holding the four numbers, the cookies row lit as the thesis. The
 * frameworks the script drops into run along the foot.
 */
export function NetworkSection() {
  return (
    <Section id={IDS.network} title={copy.title} lede={copy.lede}>
      <Panel flush>
        {/* stacked, the column may narrow past the snippet's tab bar (which then scrolls),
            or on phones the section would be wider than the screen */}
        <div className='grid grid-cols-[1.55fr_1fr] max-xl:grid-cols-1'>
          <div className='flex min-w-0 border-r border-rule-08 bg-hatch p-4.5 transition-ink max-xl:border-r-0 max-xl:border-b'>
            <SnippetPanel />
          </div>
          <div className={styles.stats}>
            {copy.stats.map((stat, i) => (
              <div key={stat.label} className={cn(styles.row, 'transition-ink')}>
                <Stat
                  index={i}
                  figure={
                    <>
                      <CountUp className={FIGURE} value={stat.value} decimals={stat.decimals} />
                      <span className='text-[19px] tracking-[-0.3px] text-muted'>{stat.unit}</span>
                    </>
                  }
                  label={stat.label}
                  body={stat.body}
                />
              </div>
            ))}
            {/* clip, not hidden: a scroll container could shrink below its text in the stack */}
            <div className={cn(styles.row, 'group relative overflow-clip bg-volt text-on-volt')}>
              {/* the seal, watermarked off the row's corner: a certificate, not a selected tab */}
              <EuSeal />
              <Stat
                lit
                index={copy.stats.length}
                figure={<b className={FIGURE}>{copy.thesis.value}</b>}
                label={copy.thesis.label}
                body={copy.thesis.body}
              />
            </div>
          </div>
          <FrameworkStrip className='col-span-full' />
        </div>
      </Panel>
    </Section>
  );
}
