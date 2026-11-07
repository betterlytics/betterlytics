'use client';

import { useSyncExternalStore } from 'react';
import styles from './reviewDock.module.css';

/* Review-only: picks which take on a section to show. Remove once a take is chosen. */

const GROUPS = {
  map: {
    label: 'Map style',
    section: 'field',
    fallback: 'dots',
    options: [
      { key: 'dots', label: 'Dots' },
      { key: 'hatch', label: 'Hatch' },
    ],
  },
} as const;

type GroupId = keyof typeof GROUPS;
export type VariantOf<G extends GroupId> = (typeof GROUPS)[G]['options'][number]['key'];

const IDS = Object.keys(GROUPS) as GroupId[];
const storeKey = (id: GroupId) => `cwv-review-${id}`;
const isOption = (id: GroupId, value: unknown): value is string =>
  GROUPS[id].options.some((option) => option.key === value);

let picks: Record<GroupId, string> | null = null;
const listeners = new Set<() => void>();

/** The URL wins, then this browser's last pick. */
function read(): Record<GroupId, string> {
  if (picks) return picks;
  const params = new URLSearchParams(location.search);
  picks = Object.fromEntries(
    IDS.map((id) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(storeKey(id));
      } catch {}
      const fromUrl = params.get(id);
      return [id, isOption(id, fromUrl) ? fromUrl : isOption(id, stored) ? stored : GROUPS[id].fallback];
    }),
  ) as Record<GroupId, string>;
  return picks;
}

const subscribe = (change: () => void) => {
  listeners.add(change);
  return () => listeners.delete(change);
};

export function useReviewVariant<G extends GroupId>(id: G): VariantOf<G> {
  return useSyncExternalStore(
    subscribe,
    () => read()[id],
    () => GROUPS[id].fallback,
  ) as VariantOf<G>;
}

function choose(id: GroupId, key: string) {
  picks = { ...read(), [id]: key };
  try {
    localStorage.setItem(storeKey(id), key);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set(id, key);
  history.replaceState(history.state, '', url);
  listeners.forEach((change) => change());
  const section = document.getElementById(GROUPS[id].section);
  const box = section?.getBoundingClientRect();
  if (section && box && (box.bottom < 0 || box.top > innerHeight)) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function Group({ id }: { id: GroupId }) {
  const value = useReviewVariant(id);
  const group = GROUPS[id];
  return (
    <div className={styles.group} role='radiogroup' aria-label={group.label}>
      <span className={styles.label}>{group.label}</span>
      {group.options.map((option) => (
        <button
          key={option.key}
          type='button'
          role='radio'
          aria-checked={value === option.key}
          data-on={value === option.key || undefined}
          onClick={() => choose(id, option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ReviewDock() {
  return (
    <div className={styles.dock}>
      {IDS.map((id) => (
        <Group key={id} id={id} />
      ))}
    </div>
  );
}
