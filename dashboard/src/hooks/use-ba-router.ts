'use client';

import { useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';

export function useBARouter() {
  const router = useRouter();
  const { start } = useTopLoader();

  const push = async (...args: Parameters<typeof router.push>) => {
    start();
    return router.push(...args);
  };

  const replace = async (...args: Parameters<typeof router.replace>) => {
    start();
    return router.replace(...args);
  };

  return {
    ...router,
    push,
    replace,
  };
}
