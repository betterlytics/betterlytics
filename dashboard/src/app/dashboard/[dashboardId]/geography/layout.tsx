'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigateWithFilters } from '@/hooks/use-navigate-with-filters';

export default function GeographyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { navigate } = useNavigateWithFilters();

  const paramsString = searchParams?.toString() ?? '';

  const isMapNav = useMemo(() => (searchParams?.get('mapNav') ?? '').toLowerCase() === 'true', [searchParams]);

  const buildUrl = (newPath: string, qs: string) => (qs ? `${newPath}?${qs}` : newPath);

  const stripFlag = (qs: string, key: string) => {
    const u = new URLSearchParams(qs);
    u.delete(key);
    return u.toString();
  };

  useEffect(() => {
    if (!pathname.includes('/geography')) return;

    const isTimeseries = pathname.includes('/timeseries');
    const isAccumulated = pathname.includes('/accumulated');

    if (isMapNav) {
      // Always land on accumulated when user explicitly asked for it
      if (isTimeseries) {
        const targetPath = pathname.replace('/timeseries', '/accumulated');
        // Keep the flag so refreshes keep honoring it
        navigate(buildUrl(targetPath, paramsString), { replace: true });
      }
      return; // Do not run the auto-flip logic below
    }

    // No force flag: keep your restrictive mobile logic
    if (isMobile && isTimeseries) {
      const targetPath = pathname.replace('/timeseries', '/accumulated');
      navigate(buildUrl(targetPath, paramsString), { replace: true });
    } else if (!isMobile && isAccumulated) {
      const targetPath = pathname.replace('/accumulated', '/timeseries');
      // Strip the forcing flag when going back to desktop
      const cleanedQs = stripFlag(stripFlag(paramsString, 'mapNav'), 'mapType');
      navigate(buildUrl(targetPath, cleanedQs), { replace: true });
    }
  }, [pathname, isMobile, navigate, isMapNav, paramsString]);

  return <>{children}</>;
}
