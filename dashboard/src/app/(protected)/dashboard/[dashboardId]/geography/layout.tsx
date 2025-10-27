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

    const isOnDesktopPath = pathname.includes('/desktop');
    const isOnMobilePath = pathname.includes('/mobile');

    if (isMobile && isOnDesktopPath) {
      const targetPath = pathname.replace('/desktop', '/mobile');
      navigate(buildUrl(targetPath, paramsString), { replace: true });
    }

    if (!isMobile && isOnMobilePath) {
      const targetPath = pathname.replace('/mobile', '/desktop');
      navigate(buildUrl(targetPath, paramsString), { replace: true });
    }
  }, [pathname, isMobile, navigate, paramsString]);

  return <>{children}</>;
}
