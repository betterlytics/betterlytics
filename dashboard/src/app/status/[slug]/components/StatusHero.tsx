import { Check, Minus, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PublicOverallStatus } from '@/entities/analytics/statusPage/publicStatusPage.entities';

const STATUS_BAND: Record<PublicOverallStatus, { Icon: LucideIcon; band: string | null; glyph: string }> = {
  operational: { Icon: Check, band: null, glyph: 'var(--sp-accent)' },
  degraded: { Icon: TriangleAlert, band: '#d97706', glyph: '#d97706' },
  partial_outage: { Icon: TriangleAlert, band: '#ea580c', glyph: '#ea580c' },
  outage: { Icon: X, band: '#dc2626', glyph: '#dc2626' },
  unknown: { Icon: Minus, band: null, glyph: '#9ca3af' },
};

type StatusHeroProps = {
  name: string;
  logoUrl: string | null;
  homepageUrl: string | null;
  overallStatus: PublicOverallStatus;
  bannerLabel: string;
  subTextLabel: string;
};

export function StatusHero({
  name,
  logoUrl,
  homepageUrl,
  overallStatus,
  bannerLabel,
  subTextLabel,
}: StatusHeroProps) {
  const { Icon, band, glyph } = STATUS_BAND[overallStatus];
  const bandForeground = band ? '#ffffff' : 'var(--sp-accent-foreground)';
  const disc = band ? '#ffffff' : 'var(--sp-accent-foreground)';

  const brand = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- served from our image route, or a client-side blob preview in the editor; already a small resized WebP, so next/image adds nothing
    <img src={logoUrl} alt={name} className='h-10 w-auto max-w-[60vw] object-contain sm:max-w-xs' />
  ) : (
    <span className='truncate text-xl font-bold tracking-tight'>{name}</span>
  );

  return (
    <header style={{ backgroundColor: band ?? 'var(--sp-accent)', color: bandForeground }}>
      <div className='mx-auto flex w-full max-w-3xl items-center px-4 pt-7 sm:px-8'>
        {homepageUrl ? (
          <a
            href={homepageUrl}
            className='min-w-0 rounded-sm transition-opacity outline-none hover:opacity-80 focus-visible:opacity-80'
          >
            {brand}
          </a>
        ) : (
          brand
        )}
      </div>
      <div className='px-4 pt-10 pb-19 text-center sm:px-8'>
        <span
          className='inline-flex h-13 w-13 items-center justify-center rounded-full'
          style={{ backgroundColor: disc, boxShadow: `0 0 0 8px color-mix(in srgb, ${disc} 18%, transparent)` }}
        >
          <Icon size={28} strokeWidth={3} style={{ color: glyph }} aria-hidden />
        </span>
        <h1 className='mt-5 text-[28px] leading-tight font-bold tracking-tight'>{bannerLabel}</h1>
        <p
          suppressHydrationWarning
          className='mt-2 text-[13px]'
          style={{ color: `color-mix(in srgb, ${bandForeground} 78%, transparent)` }}
        >
          {subTextLabel}
        </p>
      </div>
    </header>
  );
}
