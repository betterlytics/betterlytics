import type { ReactNode } from 'react';
import { cn } from '@/landing/lib/cn';
import styles from './appWindow.module.css';

/** A browser window lifted into the hero card above it; `bar` sits centred in its title bar. `bare` drops the chrome. */
export function AppWindow({
  bar,
  bare = false,
  className,
  children,
}: {
  bar?: ReactNode;
  bare?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(styles.window, '-mt-(--hero-overlap)', className)} data-bare={bare || undefined}>
      {!bare && (
        <div
          className='absolute top-[17px] left-5 z-2 flex gap-[7px] *:size-[9px] *:rounded-full *:bg-rule-22'
          aria-hidden
        >
          <i />
          <i />
          <i />
        </div>
      )}
      {bar}
      {children}
    </div>
  );
}

export const WINDOW_BAR =
  'absolute top-[9px] left-1/2 z-2 max-w-[40%] -translate-x-1/2 truncate rounded-full border border-rule-10 bg-fg/3 px-[18px] py-1 font-mono text-[11.5px] leading-[18px] text-muted max-md:max-w-[60%]';
