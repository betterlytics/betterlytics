'use client';

import { useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';
import { useCallback } from 'react';

export function useBARouter() {
  const router = useRouter();
  const { start } = useTopLoader();

  const push = useCallback(
    (...args: Parameters<typeof router.push>) => {
      start();
      return router.push(...args);
    },
    [router, start],
  );

  const replace = useCallback(
    (...args: Parameters<typeof router.replace>) => {
      start();
      return router.replace(...args);
    },
    [router, start],
  );

  return {
    ...router,
    push,
    replace,
  };
}
