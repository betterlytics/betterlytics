'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export function useUnsavedChanges<T extends Record<string, unknown>>(sections: T) {
  const serialized = useMemo(() => {
    const result = {} as Record<keyof T, string>;
    for (const key in sections) result[key] = JSON.stringify(sections[key]);
    return result;
  }, [sections]);

  const [savedBaseline, setSavedBaseline] = useState(serialized);

  const dirty = useMemo(() => {
    const result = {} as Record<keyof T, boolean>;
    for (const key in serialized) result[key] = serialized[key] !== savedBaseline[key];
    return result;
  }, [serialized, savedBaseline]);

  const isDirty = useMemo(() => Object.values(dirty).some(Boolean), [dirty]);

  const markSaved = useCallback(() => setSavedBaseline(serialized), [serialized]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return { isDirty, dirty, markSaved };
}
