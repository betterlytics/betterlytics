import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/landing/lib/cn';
import { BRAND_MARK_PATHS } from '@/landing/lib/brandPaths';
import { vars } from '@/landing/lib/cssVars';
import styles from './brandMark.module.css';

const SYMBOL_ID = 'landing-brand-mark';
const FILL_MASK_ID = 'landing-brand-mark-fill';
/** The mark's three columns, [x, width] in its viewBox. */
const COLUMNS = [
  [0, 375],
  [375, 375],
  [750, 322],
] as const;

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

/** The mark filling up column by column, as the app's loading logo does. One per page: its mask id is fixed. */
export function LoadingMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 1072 1069' aria-hidden>
      <mask id={FILL_MASK_ID}>
        {COLUMNS.map(([x, width], i) => (
          <rect
            key={x}
            className={styles.column}
            x={x}
            width={width}
            height={1069}
            fill='white'
            style={vars({ '--i': i })}
          />
        ))}
      </mask>
      <use href={`#${SYMBOL_ID}`} className={styles.ghost} />
      <use href={`#${SYMBOL_ID}`} mask={`url(#${FILL_MASK_ID})`} />
    </svg>
  );
}

export function BrandLink({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useTranslations('landing.nav');
  return (
    <Link className={cn('relative flex items-center gap-2.5', className)} href='/' aria-label={t('home')}>
      <BrandMark className='size-6 flex-none text-fg' />
      <span className={cn('text-[19px] font-semibold tracking-[-0.4px]', compact && 'max-sm:hidden')}>
        Betterlytics
      </span>
    </Link>
  );
}
