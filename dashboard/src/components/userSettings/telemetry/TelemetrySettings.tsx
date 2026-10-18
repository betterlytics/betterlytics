'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import UserSettingsSection from '@/components/userSettings/shared/UserSettingsSection';
import { Badge } from '@/components/ui/badge';
import ExternalLink from '@/components/ExternalLink';
import { getTelemetryStatusAction } from '@/app/actions/system/telemetry.action';
import { TELEMETRY_DOCS_URL } from '@/lib/telemetry-policy';

const renderCode = (chunks: React.ReactNode) => (
  <code className='bg-muted rounded px-1 py-0.5 font-mono text-xs'>{chunks}</code>
);

export default function TelemetrySettings() {
  const t = useTranslations('components.userSettings.telemetry');
  const locale = useLocale();

  const { data: status } = useQuery({
    queryKey: ['telemetryStatus'],
    queryFn: async () => {
      const result = await getTelemetryStatusAction();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });

  const [lastDelivered, setLastDelivered] = useState<string | null>(null);
  useEffect(() => {
    setLastDelivered(
      status?.lastSentAt
        ? new Date(status.lastSentAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
        : null,
    );
  }, [status?.lastSentAt, locale]);

  if (!status) return null;

  const { policy } = status;
  const statusNote = !policy.enabled
    ? t(`reason.${policy.reason}`)
    : !status.backgroundJobsEnabled
      ? t('inactiveJobsOff')
      : null;

  return (
    <>
      <UserSettingsSection
        title={t('status')}
        headerAction={
          <Badge variant={policy.enabled ? 'default' : 'secondary'}>{policy.enabled ? t('on') : t('off')}</Badge>
        }
      >
        {statusNote && <p className='text-muted-foreground text-sm'>{statusNote}</p>}
      </UserSettingsSection>

      <UserSettingsSection title={policy.enabled ? t('isSent') : t('wouldBeSent')} description={t('frequency')}>
        {status.payload ? (
          <pre className='bg-muted overflow-x-auto rounded-md p-4 text-sm'>
            {JSON.stringify(status.payload, null, 2)}
          </pre>
        ) : (
          <p className='text-muted-foreground text-sm'>{t('noIdYet')}</p>
        )}
        <dl className='grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]'>
          <dt className='font-medium'>{t('endpoint')}</dt>
          <dd className='text-muted-foreground font-mono break-all'>{status.endpoint}</dd>
          <dt className='font-medium'>{t('lastDelivered')}</dt>
          <dd className='text-muted-foreground'>{lastDelivered ?? t('neverDelivered')}</dd>
        </dl>
      </UserSettingsSection>

      <UserSettingsSection title={t('howToTurnOff')}>
        <div className='space-y-2 text-sm'>
          <p>{t.rich('turnOffSteps', { code: renderCode })}</p>
          <p className='text-muted-foreground'>{t.rich('doNotTrackAlt', { code: renderCode })}</p>
        </div>
        <ExternalLink
          href={TELEMETRY_DOCS_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400'
        >
          {t('learnMore')}
          <ArrowUpRight className='h-3.5 w-3.5' />
        </ExternalLink>
      </UserSettingsSection>
    </>
  );
}
