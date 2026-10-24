import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SpotlightList } from '@/landing/components/ui/spotlightList';
import { cn } from '@/landing/lib/cn';
import styles from './linkTiles.module.css';

export type LinkTile = { name: string; shortName?: string; icon: ReactNode; href: string };

export function LinkTiles({
  items,
  labelledBy,
  arrow = false,
  className,
}: {
  items: LinkTile[];
  labelledBy?: string;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <SpotlightList
      aria-labelledby={labelledBy}
      className={cn('grid grid-cols-2 gap-[9px] border-t border-rule-08 pt-4.5 transition-ink', className)}
    >
      {items.map((item) => (
        <li key={item.name} className={styles.tile}>
          <a
            className='relative flex items-center gap-[11px] rounded-[inherit] px-3 py-[9px] outline-hidden focus-visible:inset-ring-[1.5px] focus-visible:inset-ring-volt-soft/70 max-sm:gap-2 max-sm:px-2.5'
            href={item.href}
          >
            <span className='grid size-6.5 flex-none place-items-center rounded-md bg-fg/7 opacity-90'>
              {item.icon}
            </span>
            {item.shortName ? (
              <>
                <span className='min-w-0 truncate max-sm:hidden'>{item.name}</span>
                <span className='min-w-0 truncate sm:hidden'>{item.shortName}</span>
              </>
            ) : (
              <span className='min-w-0 truncate'>{item.name}</span>
            )}
            {arrow && <ArrowUpRight className={styles.arrow} aria-hidden />}
          </a>
        </li>
      ))}
    </SpotlightList>
  );
}
