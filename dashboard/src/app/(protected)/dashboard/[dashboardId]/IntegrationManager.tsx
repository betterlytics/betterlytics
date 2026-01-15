'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { IntegrationSheet } from '@/components/integration/IntegrationSheet';

export function IntegrationManager() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const showIntegration = searchParams?.get('showIntegration');
    if (showIntegration === 'true') {
      setIsSheetOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  return <IntegrationSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />;
}
