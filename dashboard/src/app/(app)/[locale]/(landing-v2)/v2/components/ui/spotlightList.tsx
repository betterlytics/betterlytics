'use client';

import type { MouseEvent, ReactNode } from 'react';

/**
 * A list whose items carry a pointer-following light. On every move the
 * pointer's position inside the hovered item is written to `--mx` / `--my`,
 * and the item's stylesheet paints a radial gradient there. One handler on the
 * list serves every item; nothing re-renders.
 */
export function SpotlightList({ className, children }: { className?: string; children: ReactNode }) {
  const track = (e: MouseEvent<HTMLUListElement>) => {
    const item = (e.target as HTMLElement).closest('li');
    if (!item || !e.currentTarget.contains(item)) return;
    const r = item.getBoundingClientRect();
    item.style.setProperty('--mx', `${e.clientX - r.left}px`);
    item.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <ul className={className} onMouseMove={track}>
      {children}
    </ul>
  );
}
