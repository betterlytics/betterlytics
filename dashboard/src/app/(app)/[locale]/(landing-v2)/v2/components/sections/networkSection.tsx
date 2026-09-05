import { CountUp } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/countUp';
import { Panel, Section, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { Reveal } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/reveal';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

const copy = COPY.network;

/** Four numbers; the last one, in brand colour, is the thesis. */
export function NetworkSection() {
  return (
    <Section id={IDS.network}>
      <SectionHead title={copy.title} lede={copy.lede} />
      <Panel flush>
        <div className='statpanel'>
          {copy.stats.map((stat, i) => (
            <Reveal key={stat.label} className='cell' index={i}>
              <span className='mono'>{stat.label}</span>
              <div className='stat'>
                <CountUp value={stat.value} decimals={stat.decimals} />
                <em>{stat.unit}</em>
              </div>
              <p>{stat.body}</p>
            </Reveal>
          ))}
          <Reveal className='cell cell--volt' index={copy.stats.length}>
            <span className='mono'>{copy.thesis.label}</span>
            <div className='stat'>
              <b>{copy.thesis.value}</b>
            </div>
            <p>{copy.thesis.body}</p>
          </Reveal>
        </div>
      </Panel>
    </Section>
  );
}
