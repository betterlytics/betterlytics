'use client';

import type { ComponentPropsWithoutRef, MouseEvent } from 'react';

/**
 * A list whose items carry a pointer-following light. On every move the
 * pointer's position inside the hovered item is written to `--mx` / `--my`,
 * and the item's stylesheet paints a radial gradient there. One handler on the
 * list serves every item; nothing re-renders.
 */
export function SpotlightList(props: Omit<ComponentPropsWithoutRef<'ul'>, 'onMouseMove'>) {
  const track = (e: MouseEvent<HTMLUListElement>) => {
    const item = (e.target as Element).closest('li');
    if (!item || !e.currentTarget.contains(item)) return;
    const r = item.getBoundingClientRect();
    item.style.setProperty('--mx', `${e.clientX - r.left}px`);
    item.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return <ul {...props} onMouseMove={track} />;
}
