'use client';

import { useEffect, useState } from 'react';

/** Shown only after a link from our own site, so Back never leaves it. */
export function GoBackButton({ label, className }: { label: string; className?: string }) {
  const [cameFromHere, setCameFromHere] = useState(false);
  useEffect(() => {
    setCameFromHere(document.referrer.startsWith(`${window.location.origin}/`));
  }, []);
  if (!cameFromHere) return null;
  return (
    <button type='button' onClick={() => window.history.back()} className={className}>
      {label}
    </button>
  );
}
