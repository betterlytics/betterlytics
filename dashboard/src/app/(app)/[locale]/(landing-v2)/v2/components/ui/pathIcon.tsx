import type { PathIconData } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/icons';

export function PathIcon({ icon, className }: { icon: PathIconData; className?: string }) {
  return (
    <svg className={className} viewBox={icon.viewBox} aria-hidden>
      <path d={icon.d} fill='currentColor' fillRule={icon.evenOdd ? 'evenodd' : undefined} />
    </svg>
  );
}
