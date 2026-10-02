import { Link } from '@/i18n/navigation';
import { COPY } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { BRAND_MARK_PATHS } from '@/landing/lib/brandPaths';

const SYMBOL_ID = 'landing-brand-mark';

/** Render once per page; every <BrandMark /> references it. */
export function BrandMarkDefs() {
  return (
    <svg width={0} height={0} className='absolute' aria-hidden focusable='false'>
      <symbol id={SYMBOL_ID} viewBox='0 0 1072 1069'>
        {BRAND_MARK_PATHS.map((d, i) => (
          <path key={i} d={d} fill='currentColor' />
        ))}
      </symbol>
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden>
      <use href={`#${SYMBOL_ID}`} />
    </svg>
  );
}

export function BrandLink({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link className={cn('relative flex items-center gap-2.5', className)} href='/' aria-label={COPY.nav.home}>
      <BrandMark className='size-6 flex-none text-fg' />
      <span className={cn('text-[19px] font-semibold tracking-[-0.4px]', compact && 'max-sm:hidden')}>
        Betterlytics
      </span>
    </Link>
  );
}
