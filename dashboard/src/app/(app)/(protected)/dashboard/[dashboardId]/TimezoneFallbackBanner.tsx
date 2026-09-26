'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import UserSettingsDialog from '@/components/userSettings/UserSettingsDialog';
import { useBannerContext } from '@/contexts/BannerProvider';
import { useResolvedTimezone } from '@/hooks/use-resolved-timezone';

const BANNER_ID = 'timezone-fallback-banner';

export function TimezoneFallbackBanner() {
  const t = useTranslations('banners.timezoneFallback');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { source } = useResolvedTimezone();
  const { addBanner, removeBanner } = useBannerContext();

  useEffect(() => {
    if (source === 'fallback') {
      addBanner({
        id: BANNER_ID,
        level: 'warning',
        title: t('title'),
        description: t('description'),
        action: (
          <Button
            variant='default'
            className='text-primary-foreground cursor-pointer border-1 border-white bg-amber-600/50 shadow-md hover:bg-amber-600/20'
            size='sm'
            onClick={() => setIsDialogOpen(true)}
          >
            {t('action')}
          </Button>
        ),
        dismissible: true,
        scope: 'global',
      });
    } else {
      removeBanner(BANNER_ID);
    }

    return () => removeBanner(BANNER_ID);
  }, [source, addBanner, removeBanner, t]);

  return <UserSettingsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} initialTab='preferences' />;
}
