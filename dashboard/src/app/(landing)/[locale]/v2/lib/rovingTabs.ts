import type { Dispatch, KeyboardEvent } from 'react';

/** Where `key` moves along `count` tabs from `index`: arrows step and wrap round, Home and End go to the ends. */
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

/**
 * The keyboard half of the tabs pattern, for the element with `role='tablist'`: only
 * the selected tab is in the tab order (`tabIndex` 0, the rest -1), and the keys above
 * select the tab they move to and focus it.
 */
export function rovingTabKeys(index: number, count: number, select: Dispatch<number>) {
  return (event: KeyboardEvent<HTMLElement>) => {
    const next = nextTabIndex(event.key, index, count);
    if (next === null) return;
    event.preventDefault();
    select(next);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };
}
