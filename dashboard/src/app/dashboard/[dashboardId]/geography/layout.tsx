'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigateWithFilters } from '@/hooks/use-navigate-with-filters';

export default function GeographyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { navigate } = useNavigateWithFilters();

  useEffect(() => {
    if (!pathname.includes('/geography')) return;

    const isTimeseries = pathname.includes('/timeseries');
    const isAccumulated = pathname.includes('/accumulated');

    if (isMobile && isTimeseries) {
      navigate(pathname.replace('/timeseries', '/accumulated'), { replace: true });
    } else if (!isMobile && isAccumulated) {
      navigate(pathname.replace('/accumulated', '/timeseries'), { replace: true });
    }
  }, [pathname, isMobile, navigate]);

  return <>{children}</>;
}
