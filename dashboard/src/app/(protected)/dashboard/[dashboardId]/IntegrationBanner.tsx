'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IntegrationSheet } from '@/components/integration/IntegrationSheet';
import { useTrackingVerification } from '@/hooks/use-tracking-verification';
import { useTranslations } from 'next-intl';
import { useBannerContext } from '@/contexts/BannerProvider';

export function IntegrationBanner() {
  const t = useTranslations('banners.integrationSetup');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isVerified, isLoading } = useTrackingVerification();
  const { addBanner, removeBanner } = useBannerContext();

  useEffect(() => {
    if (!isLoading && !isVerified) {
      addBanner({
        id: 'integration-banner',
        level: 'warning',
        title: t('title'),
        description: t('description'),
        action: (
          <Button
            variant='default'
            className='text-primary-foreground cursor-pointer border-1 border-white bg-amber-600/50 shadow-md hover:bg-amber-600/20'
            size='sm'
            onClick={() => setIsSheetOpen(true)}
          >
            {t('setup')}
          </Button>
        ),
        dismissible: true,
        scope: 'global',
      });
    } else {
      removeBanner('integration-banner');
    }

    return () => removeBanner('integration-banner');
  }, [isLoading, isVerified, addBanner, removeBanner, t]);

  return <IntegrationSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />;
}
