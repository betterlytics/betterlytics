'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useSearchParamKey(key: string, value: string = 'true'): [boolean, (state: boolean) => void] {
  const searchParams = useSearchParams();
  const [isKeySet, setIsKeySet] = useState(false);

  useEffect(() => {
    setIsKeySet(searchParams?.get(key) === value);
  }, [searchParams]);

  const toggleKey = (state: boolean) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (state) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
      window.history.pushState({}, '', url.toString());
    }
    setIsKeySet(state);
  };

  return [isKeySet, toggleKey];
}
