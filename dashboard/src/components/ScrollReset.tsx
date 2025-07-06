'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * There's a known bug that scroll does not reset between pages in Next
 * https://github.com/vercel/next.js/issues/45187
 *
 * This is component implementation is a recommended workaround to that
 */
export default function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
