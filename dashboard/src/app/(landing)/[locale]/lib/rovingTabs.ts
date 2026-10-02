import type { Dispatch, KeyboardEvent } from 'react';

export function nextTabIndex(key: string, index: number, count: number) {
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count;
    case 'ArrowLeft':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/** onKeyDown for the `role='tablist'` element; give the selected tab `tabIndex` 0, the rest -1. */
export function rovingTabKeys(index: number, count: number, select: Dispatch<number>) {
  return (event: KeyboardEvent<HTMLElement>) => {
    const next = nextTabIndex(event.key, index, count);
    if (next === null) return;
    event.preventDefault();
    select(next);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };
}
