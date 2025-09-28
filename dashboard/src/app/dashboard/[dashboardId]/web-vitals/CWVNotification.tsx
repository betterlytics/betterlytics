'use client';
import { use, useEffect } from 'react';
import { useNotificationsContext } from '@/contexts/NotificationProvider';
import { useTranslations } from 'next-intl';

type CWVNotificationHandlerProps = {
  hasDataPromise: Promise<boolean>;
};

export function CWVNotificationHandler({ hasDataPromise }: CWVNotificationHandlerProps) {
  const hasData = use(hasDataPromise);
  const t = useTranslations('components.webVitals.data');
  const { addNotification, removeNotification } = useNotificationsContext();
  useEffect(() => {
    if (hasData === false) {
      addNotification({
        id: 'no-cwv-data',
        level: 'warning',
        text: t('noData'),
      });
    } else {
      removeNotification('no-cwv-data');
    }
  }, [hasData, t]);

  return null;
}
