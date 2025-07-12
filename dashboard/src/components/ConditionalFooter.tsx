'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer/Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  const isAuthenticatedPage =
    pathname?.startsWith('/dashboard') || pathname?.startsWith('/dashboards') || pathname?.startsWith('/billing');

  if (isAuthenticatedPage) {
    return null;
  }

  return <Footer />;
}
