import { EuSeal } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/euSeal';
import { FrameworkStrip } from '@/app/(app)/[locale]/(landing-v2)/v2/components/sections/frameworkStrip';
import { SnippetPanel } from '@/app/(app)/[locale]/(landing-v2)/v2/components/sections/snippetPanel';
import { CountUp } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/countUp';
import { Panel, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { Reveal } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/reveal';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';

const copy = COPY.network;

/**
 * cloudflare.com's code-example split: the snippet on hatched paper, with a
 * file tab per framework, beside a stack of rows. Here the rows are the four
 * numbers, with the cookies row lit as the thesis.
 */
export function NetworkSnippet() {
  return (
    <>
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
              <EuSeal variant='lock' />
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
    </>
  );
}
