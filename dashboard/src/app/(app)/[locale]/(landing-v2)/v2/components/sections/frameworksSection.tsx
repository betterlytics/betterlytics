import Image from 'next/image';
import { Panel, Section, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { FRAMEWORK_ROWS, type Framework } from '@/app/(app)/[locale]/(landing-v2)/v2/content/frameworks';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

function Tile({ framework }: { framework: Framework }) {
  return (
    <span className='fwi'>
      <b>
        <Image
          src={`/framework-logos/${framework.logo}-icon.svg`}
          alt=''
          width={17}
          height={17}
          className='fwico'
          unoptimized
        />
      </b>
      <span>{framework.name}</span>
    </span>
  );
}

/** Two counter-rotating marquees. Each row is rendered twice so the -50% loop is seamless. */
export function FrameworksSection() {
  return (
    <Section id={IDS.frameworks}>
      <SectionHead title={COPY.frameworks.title} lede={COPY.frameworks.lede} />
      <Panel>
        <div className='fw'>
          {FRAMEWORK_ROWS.map((row, r) => (
            <div key={r} className='fw__row'>
              {row.map((framework) => (
                <Tile key={framework.name} framework={framework} />
              ))}
              <span aria-hidden style={{ display: 'contents' }}>
                {row.map((framework) => (
                  <Tile key={framework.name} framework={framework} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  );
}
