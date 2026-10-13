'use client';

import type { ComponentPropsWithoutRef, MouseEvent } from 'react';

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
