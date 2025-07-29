'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useHashKey(key: string): [boolean, (state: boolean) => void] {
  const router = useRouter();
  const [isKeySet, setIsKeySet] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      if (typeof window !== 'undefined') {
        setIsKeySet(window.location.hash === `#${key}`);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, [key]);

  const toggleKey = (state: boolean) => {
    const hash = state ? `#${key}` : '';
    router.push(`${window.location.search}${hash}`);
    setIsKeySet(state);
  };

  return [isKeySet, toggleKey];
}
