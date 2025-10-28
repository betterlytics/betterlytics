'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigateWithFilters } from '@/hooks/use-navigate-with-filters';

export default function GeographyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { navigate } = useNavigateWithFilters();

  const paramsString = searchParams?.toString() ?? '';

  const buildUrl = (newPath: string, qs: string) => (qs ? `${newPath}?${qs}` : newPath);

  useEffect(() => {
    if (!pathname.includes('/geography')) return;

    // Mobile should always show accumulated
    if (isMobile && pathname.includes('/desktop')) {
      const targetPath = pathname.replace('/desktop', '/mobile');
      navigate(buildUrl(targetPath, paramsString), { replace: true });
    }

    // Desktop should always default to timeseries
    if (!isMobile && pathname.includes('/mobile')) {
      const targetPath = pathname.replace('/mobile', '/desktop');
      navigate(buildUrl(targetPath, paramsString), { replace: true });
    }
  }, [pathname, isMobile, navigate, paramsString]);

  return <>{children}</>;
}
