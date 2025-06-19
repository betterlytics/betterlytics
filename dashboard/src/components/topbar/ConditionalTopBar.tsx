'use client';

import { usePathname } from 'next/navigation';
import PublicTopBar from './PublicTopBar';
import BATopbar from './BATopbar';

export default function ConditionalTopBar() {
  const pathname = usePathname();

  const isAuthenticatedPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/dashboards');

  if (isAuthenticatedPage) {
    return <BATopbar />;
  }

  return <PublicTopBar />;
}
