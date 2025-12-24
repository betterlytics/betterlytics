'use client';

import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { LabeledSlider } from '@/components/inputs/LabeledSlider';
import { SettingToggle } from '@/components/inputs/SettingToggle';
import { EmailTokenInput } from '@/components/inputs/EmailTokenInput';
import { MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { SectionHeader } from './SectionHeader';
import { SSL_EXPIRY_DISPLAY_MARKS, RECOMMENDED_SSL_EXPIRY_DAYS } from '../utils/sliderConstants';
import { useMonitorForm } from '../hooks/useMonitorForm';

type AlertsSectionProps = {
  form: ReturnType<typeof useMonitorForm>;
  isPending: boolean;
  userEmail?: string | null;
  sslMonitoringEnabled: boolean;
};

export function AlertsSection({ form, isPending, userEmail, sslMonitoringEnabled }: AlertsSectionProps) {
  const t = useTranslations('monitoringEditDialog.alerts');
  const { alerts } = form.state;

  return (
    <section className='space-y-5'>
      <div className='flex items-center justify-between'>
        <SectionHeader icon={Bell} title={t('title')} />
        <SettingToggle
          id='alerts-enabled'
          label=''
          checked={alerts.enabled}
          onCheckedChange={(v) => form.updateAlert('enabled', v)}
          disabled={isPending}
        />
      </div>

      {alerts.enabled && (
        <div className='space-y-5'>
          {/* Email Recipients */}
          <div className='space-y-3'>
            <div>
              <Label className='text-sm font-medium'>{t('recipients')}</Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>{t('recipientsDescription')}</p>
            </div>

            <EmailTokenInput
              emails={alerts.emails}
              onAddEmail={form.tryAddAlertEmail}
              onRemoveEmail={form.removeAlertEmail}
              disabled={isPending}
              placeholder={t('emailPlaceholder')}
              suggestedEmail={userEmail ?? undefined}
              maxEmails={MONITOR_LIMITS.ALERT_EMAILS_MAX}
            />
          </div>

          <div className='space-y-4'>
            <SettingToggle
              id='alert-on-down'
              label={t('onDown')}
              checked={alerts.onDown}
              onCheckedChange={(v) => form.updateAlert('onDown', v)}
              disabled={isPending}
            />

            <SettingToggle
              id='alert-on-recovery'
              label={t('onRecovery')}
              checked={alerts.onRecovery}
              onCheckedChange={(v) => form.updateAlert('onRecovery', v)}
              disabled={isPending}
            />

            <SettingToggle
              id='alert-on-ssl-expiry'
              label={t('onSslExpiry')}
              checked={sslMonitoringEnabled && alerts.onSslExpiry}
              onCheckedChange={(v) => form.updateAlert('onSslExpiry', v)}
              disabled={isPending || !sslMonitoringEnabled}
              disabledTooltip={!sslMonitoringEnabled ? t('sslExpiryDisabledTooltip') : undefined}
            />

            {sslMonitoringEnabled && alerts.onSslExpiry && (
              <div className='pt-2'>
                <LabeledSlider
                  label={t('sslExpiryDays')}
                  description={t('sslExpiryDaysDescription')}
                  value={alerts.sslExpiryDays}
                  min={1}
                  max={90}
                  marks={SSL_EXPIRY_DISPLAY_MARKS}
                  onValueChange={(val) => form.updateAlert('sslExpiryDays', val)}
                  formatValue={(v) => t('daysCount', { count: v })}
                  recommendedValue={RECOMMENDED_SSL_EXPIRY_DAYS}
                  disabled={isPending}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
