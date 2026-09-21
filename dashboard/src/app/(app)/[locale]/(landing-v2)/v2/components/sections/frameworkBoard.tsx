import Image from 'next/image';
import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { FRAMEWORK_ROWS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/frameworks';

/**
 * The frameworks as a still, ruled board under the stat tiles, in the same
 * grammar as the customer wall: a claim cell on the left, one framework per
 * cell. It shares the network section's headline, since "one script, nothing
 * else to add" is the same claim seen from the framework's side.
 */
export function FrameworkBoard() {
  return (
    <div className='fwb'>
      <div className='fwb__label'>
        <p>
          <Emphasis text={COPY.frameworks.title} wrap={(span) => <em>{span}</em>} />
        </p>
        <p>{COPY.frameworks.lede}</p>
      </div>
      {FRAMEWORK_ROWS.flat().map((framework) => (
        <span key={framework.name} className='fwb__cell'>
          <Image
            src={`/framework-logos/${framework.logo}-icon.svg`}
            alt=''
            width={18}
            height={18}
            className='fwico'
            unoptimized
          />
          <span>{framework.name}</span>
        </span>
      ))}
    </div>
  );
}
