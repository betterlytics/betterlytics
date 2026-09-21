import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Emphasis } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/emphasis';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { FRAMEWORK_ROWS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/frameworks';

/**
 * The frameworks as a quiet "works with" row: the claim on the left, one
 * monochrome mark per framework, names on hover. The compatibility strip
 * cloudflare.com uses under its developer sections, rather than a board.
 */
export function FrameworkStrip({ className }: { className?: string }) {
  return (
    <div className={cn('fws', className)}>
      <p className='fws__lab'>
        <Emphasis text={COPY.frameworks.title} wrap={(span) => <em>{span}</em>} />
        <span>{COPY.frameworks.lede}</span>
      </p>
      <ul className='fws__row'>
        {FRAMEWORK_ROWS.flat().map((framework) => (
          <li key={framework.name} title={framework.name} data-dark={framework.dark ? '' : undefined}>
            <Image
              src={`/framework-logos/${framework.logo}-icon.svg`}
              alt={framework.name}
              width={20}
              height={20}
              unoptimized
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
