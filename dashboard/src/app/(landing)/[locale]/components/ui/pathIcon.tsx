import type { PathIconData } from '@/landing/lib/icons';

export function PathIcon({ icon, className }: { icon: PathIconData; className?: string }) {
  return (
    <svg className={className} viewBox={icon.viewBox} aria-hidden>
      <path d={icon.d} fill='currentColor' fillRule={icon.evenOdd ? 'evenodd' : undefined} />
    </svg>
  );
}
