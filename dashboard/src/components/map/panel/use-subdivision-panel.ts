'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { parseCountryParam, SUBDIVISION_COUNTRY_PARAM } from './params';

// Plain next router: a same-page param change should not flash the top loader
export function useSubdivisionPanel() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const countryCode = parseCountryParam(searchParams?.get(SUBDIVISION_COUNTRY_PARAM));

  const open = useCallback(
    (code: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(SUBDIVISION_COUNTRY_PARAM, code);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete(SUBDIVISION_COUNTRY_PARAM);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  return { countryCode, open, close };
}
