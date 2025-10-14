'use client';
import { use, useEffect } from 'react';
import { useNotificationsContext } from '@/contexts/NotificationProvider';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type CWVNotificationHandlerProps = {
  hasDataPromise: Promise<boolean>;
};

export function CWVNotificationHandler({ hasDataPromise }: CWVNotificationHandlerProps) {
  const hasData = use(hasDataPromise);
  const t = useTranslations('banners.webVitalsNoData');
  const { addNotification, removeNotification } = useNotificationsContext();
  useEffect(() => {
    if (hasData === false) {
      addNotification({
        id: 'no-cwv-data',
        level: 'warning',
        title: t('title'),
        description: t('description'),
        action: (
          <Button
            variant='outline'
            className='cursor-pointer border border-black/20 bg-transparent text-black shadow-md hover:bg-black/10'
            onClick={() => {
              window.open('https://betterlytics.io/docs/integration/web-vitals', '_blank');
            }}
          >
            {t('action')}
          </Button>
        ),
        dismissible: true,
      });
    } else {
      removeNotification('no-cwv-data');
    }
  }, [hasData, t]);

  return null;
}
