'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/* only after a link from our own site, so Back never leaves it */
function cameFromHere() {
  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function GoBackButton({ label, className }: { label: string; className?: string }) {
  const canGoBack = useSyncExternalStore(subscribe, cameFromHere, () => false);
  if (!canGoBack) return null;
  return (
    <button type='button' onClick={() => window.history.back()} className={className}>
      {label}
    </button>
  );
}
