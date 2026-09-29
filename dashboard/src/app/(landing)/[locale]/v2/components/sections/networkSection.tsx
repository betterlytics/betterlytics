import { EuSeal } from '@/landing/components/illustrations/euSeal';
import { FrameworkStrip } from './frameworkStrip';
import { SnippetPanel } from './snippetPanel';
import { CountUp } from '@/landing/components/ui/countUp';
import { Panel, Section, SectionHead } from '@/landing/components/ui/frame';
import { Reveal } from '@/landing/components/ui/reveal';
import { COPY } from '@/landing/content/copy';
import { IDS } from '@/landing/lib/ids';

const copy = COPY.network;

/**
 * The "one script" section, after cloudflare.com's code-example split: the
 * install snippet on hatched paper with a tab per framework, beside a stack of
 * rows holding the four numbers, the cookies row lit as the thesis. The
 * frameworks the script drops into run along the foot.
 */
export function NetworkSection() {
  return (
    <Section id={IDS.network}>
      <SectionHead title={copy.title} lede={copy.lede} />
      <Panel flush>
        <div className='snip'>
          <div className='snip__code'>
            <SnippetPanel />
          </div>
          <div className='snip__rows'>
            {copy.stats.map((stat, i) => (
              <Reveal key={stat.label} className='snip__row' index={i}>
                <div className='stat'>
                  <CountUp value={stat.value} decimals={stat.decimals} />
                  <em>{stat.unit}</em>
                </div>
                <div>
                  <span className='label'>{stat.label}</span>
                  <p>{stat.body}</p>
                </div>
              </Reveal>
            ))}
            <Reveal className='snip__row snip__row--volt' index={copy.stats.length}>
              {/* the seal, watermarked off the row's corner: a certificate, not a selected tab */}
              <EuSeal />
              <div className='stat'>
                <b>{copy.thesis.value}</b>
              </div>
              <div>
                <span className='label'>{copy.thesis.label}</span>
                <p>{copy.thesis.body}</p>
              </div>
            </Reveal>
          </div>
          <FrameworkStrip />
        </div>
      </Panel>
    </Section>
  );
}
