'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { IntegrationSheet } from '@/components/integration/IntegrationSheet';
import { useBARouter } from '@/hooks/use-ba-router';

export function IntegrationManager() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useBARouter();

  useEffect(() => {
    const showIntegration = searchParams?.get('showIntegration');
    if (showIntegration === 'true') {
      setIsSheetOpen(true);
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  return <IntegrationSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />;
}
