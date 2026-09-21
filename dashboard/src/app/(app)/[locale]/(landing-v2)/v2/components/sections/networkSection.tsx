import { EuSeal, type SealVariant } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/euSeal';
import { FrameworkBoard } from '@/app/(app)/[locale]/(landing-v2)/v2/components/sections/frameworkBoard';
import { NetworkBento } from '@/app/(app)/[locale]/(landing-v2)/v2/components/sections/networkBento';
import { NetworkSnippet } from '@/app/(app)/[locale]/(landing-v2)/v2/components/sections/networkSnippet';
import { CountUp } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/countUp';
import { Panel, Section, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { Reveal } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/reveal';
import { Variants } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/variants';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

const copy = COPY.network;
const SEAL: SealVariant = 'lock';

/** Four stat tiles in a row, the frameworks as a ruled board beneath. */
function NetworkBoard() {
  return (
    <>
      <SectionHead title={copy.title} lede={copy.lede} />
      <Panel flush>
        <div className='statpanel'>
          {copy.stats.map((stat, i) => (
            <Reveal key={stat.label} className='cell' index={i}>
              <div className='stat'>
                <CountUp value={stat.value} decimals={stat.decimals} />
                <em>{stat.unit}</em>
              </div>
              <span className='label'>{stat.label}</span>
              <p>{stat.body}</p>
            </Reveal>
          ))}
          <Reveal className='cell cell--volt' index={copy.stats.length}>
            {SEAL === 'lock' ? <EuSeal variant='lock' /> : null}
            <div className='stat'>
              {SEAL === 'ring' ? <EuSeal variant='ring' /> : null}
              <b>{copy.thesis.value}</b>
            </div>
            <span className='label'>{copy.thesis.label}</span>
            <p>{copy.thesis.body}</p>
          </Reveal>
        </div>
        <FrameworkBoard />
      </Panel>
    </>
  );
}

/**
 * The "one script" section: the four numbers and the frameworks the script
 * drops into. Three layouts are live behind the preview toggle (lib/variants)
 * until one is chosen.
 */
export function NetworkSection() {
  return (
    <Section id={IDS.network}>
      <Variants board={<NetworkBoard />} bento={<NetworkBento />} snippet={<NetworkSnippet />} />
    </Section>
  );
}
