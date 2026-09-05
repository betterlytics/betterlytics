import { BRAND_MARK_PATHS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/brandPaths';

const SYMBOL_ID = 'lp2-logo';

/** Defines the mark once per page; every <BrandMark /> references it and takes currentColor. */
export function BrandMarkDefs() {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden focusable='false'>
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
