import { EuSeal } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/euSeal';
import { FrameworkStrip } from '@/app/(app)/[locale]/(landing-v2)/v2/components/sections/frameworkStrip';
import { CountUp } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/countUp';
import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { Panel } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { Reveal } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/reveal';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { LINKS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/links';

const copy = COPY.network;

/**
 * cloudflare.com's use-case bento: a label cell carries the headline and the
 * framework marks, the other cells carry one number each with its name and a
 * line of body. No pictures: the numbers are the pictures.
 */
export function NetworkBento() {
  return (
    <Panel flush>
      <div className='bento'>
        <div className='bento__label'>
          <h2 className='bento__title'>
            <Emphasis text={copy.title} wrap={(span) => <em>{span}</em>} />
          </h2>
          <p>{copy.lede}</p>
          <FrameworkStrip className='fws--stack' />
          <a className='btn btn--line btn--sm' href={LINKS.docs}>
            {copy.cta}
          </a>
        </div>
        {copy.stats.map((stat, i) => (
          <Reveal key={stat.label} className='bento__cell' index={i}>
            <div className='stat'>
              <CountUp value={stat.value} decimals={stat.decimals} />
              <em>{stat.unit}</em>
            </div>
            <span className='label'>{stat.label}</span>
            <p>{stat.body}</p>
          </Reveal>
        ))}
        <Reveal className='bento__cell bento__cell--volt' index={copy.stats.length}>
          <EuSeal variant='lock' />
          <div className='stat'>
            <b>{copy.thesis.value}</b>
          </div>
          <span className='label'>{copy.thesis.label}</span>
          <p>{copy.thesis.body}</p>
        </Reveal>
      </div>
    </Panel>
  );
}
