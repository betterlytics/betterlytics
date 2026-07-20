'use client';

import { useEffect, useState } from 'react';

export function useDisplayHour12(): boolean {
  const [hour12, setHour12] = useState(false);
  useEffect(() => {
    const resolved = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12;
    if (resolved != null) setHour12(resolved);
  }, []);
  return hour12;
}
