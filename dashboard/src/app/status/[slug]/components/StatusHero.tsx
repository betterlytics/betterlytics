import { Check, Minus, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PublicOverallStatus } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { cn } from '@/lib/utils';

const STATUS_HERO: Record<PublicOverallStatus, { Icon: LucideIcon; color: string }> = {
  operational: { Icon: Check, color: '#16a34a' },
  degraded: { Icon: TriangleAlert, color: '#d97706' },
  partial_outage: { Icon: TriangleAlert, color: '#ea580c' },
  outage: { Icon: X, color: '#dc2626' },
  unknown: { Icon: Minus, color: '#6b7280' },
};

type StatusHeroProps = {
  overallStatus: PublicOverallStatus;
  bannerLabel: string;
  subTextLabel: string;
  /** Rounding + border-side tweaks from the combined card (e.g. no bottom border/rounding
      when the monitor section continues the card below). */
  className?: string;
};

/** Status-colored top section of the combined status card. Carries the incident
    color so the brand band above never has to change. Its border is a translucent
    wash of the status color rather than the card border. */
export function StatusHero({ overallStatus, bannerLabel, subTextLabel, className }: StatusHeroProps) {
  const { Icon, color } = STATUS_HERO[overallStatus];

  return (
    <div
      className={cn('border bg-clip-padding px-4 py-8 text-center text-white @min-[640px]:px-8', className)}
      style={{ backgroundColor: color, borderColor: `color-mix(in srgb, ${color} 55%, transparent)` }}
    >
      <span
        className='inline-flex h-13 w-13 items-center justify-center rounded-full bg-white'
        style={{ boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.18)' }}
      >
        <Icon size={28} strokeWidth={3} style={{ color }} aria-hidden />
      </span>
      <h1 className='mt-4 text-2xl leading-tight font-bold tracking-tight'>{bannerLabel}</h1>
      <p suppressHydrationWarning className='mt-2 text-[13px] text-white/80'>
        {subTextLabel}
      </p>
    </div>
  );
}
