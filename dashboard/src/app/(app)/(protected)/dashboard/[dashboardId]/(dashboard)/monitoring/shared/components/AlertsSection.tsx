'use client';

import { Bell, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LabeledSlider } from '@/components/inputs/LabeledSlider';
import { SettingToggle } from '@/components/inputs/SettingToggle';
import { WarningBanner } from '@/components/WarningBanner';
import { useClientFeatureFlags } from '@/hooks/use-client-feature-flags';
import { SectionHeader } from './SectionHeader';
import { SSL_EXPIRY_MARKS, SSL_EXPIRY_DISPLAY_MARKS, RECOMMENDED_SSL_EXPIRY_DAYS } from '../utils/sliderConstants';
import type { MonitorFormInterface } from '../types';

export type AlertsSectionProps = {
  form: MonitorFormInterface;
  isPending: boolean;
  userEmail: string;
  sslMonitoringEnabled: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

export function AlertsSection({
  form,
  isPending,
  userEmail,
  sslMonitoringEnabled,
  open,
  onOpenChange,
  defaultOpen = false,
}: AlertsSectionProps) {
  const t = useTranslations('monitoringEditDialog.alerts');
  const { state, setField } = form;
  const alertEmailsEnabled = useClientFeatureFlags().isFeatureFlagEnabled('enableEmails');
  // Alerts only deliver over email; keep the stored preference but never present it as active when emails are off
  const alertsActive = alertEmailsEnabled && state.alertsEnabled;
  // Config-blocked: keep the options discoverable (disabled). User-disabled: collapse them.
  const showAlertOptions = !alertEmailsEnabled || state.alertsEnabled;
  const optionsDisabled = isPending || !alertEmailsEnabled;

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={open === undefined ? defaultOpen : undefined}
      className='group/alerts'
    >
      <CollapsibleTrigger className='hover:bg-muted/50 -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors'>
        <SectionHeader icon={Bell} title={t('title')} />
        <div className='flex items-center gap-2'>
          {!alertEmailsEnabled && (
            <span className='rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400'>
              {t('emailsNotConfigured.badge')}
            </span>
          )}
          {alertsActive && (
            <span className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
              {t('enabled')}
            </span>
          )}
          <ChevronDown className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]/alerts:rotate-180' />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-x-visible overflow-y-clip'>
        <div className='space-y-5 pt-4 pb-3'>
          {!alertEmailsEnabled && (
            <WarningBanner
              title={t('emailsNotConfigured.title')}
              description={t('emailsNotConfigured.description')}
            />
          )}

          <SettingToggle
            id='alerts-enabled'
            label={
              <>
                {t('enableAlerts')} <span className='text-muted-foreground font-normal'>({userEmail})</span>
              </>
            }
            checked={alertsActive}
            onCheckedChange={setField('alertsEnabled')}
            disabled={isPending || !alertEmailsEnabled}
            disabledTooltip={!alertEmailsEnabled ? t('emailsNotConfigured.tooltip') : undefined}
          />

          {showAlertOptions && (
            <div className='space-y-5 pl-1'>
              <SettingToggle
                id='alert-on-down'
                label={t('onDown')}
                checked={state.alertOnDown}
                onCheckedChange={setField('alertOnDown')}
                disabled={optionsDisabled}
              />

              <SettingToggle
                id='alert-on-recovery'
                label={t('onRecovery')}
                checked={state.alertOnRecovery}
                onCheckedChange={setField('alertOnRecovery')}
                disabled={optionsDisabled}
              />

              <SettingToggle
                id='alert-on-ssl-expiry'
                label={t('onSslExpiry')}
                checked={sslMonitoringEnabled && state.alertOnSslExpiry}
                onCheckedChange={setField('alertOnSslExpiry')}
                disabled={optionsDisabled || !sslMonitoringEnabled}
                disabledTooltip={
                  alertEmailsEnabled && !sslMonitoringEnabled ? t('sslExpiryDisabledTooltip') : undefined
                }
              />

              {sslMonitoringEnabled && state.alertOnSslExpiry && (
                <div className='pt-2'>
                  <LabeledSlider
                    label={t('sslExpiryDays')}
                    description={t('sslExpiryDaysDescription')}
                    value={SSL_EXPIRY_MARKS.indexOf(state.sslExpiryAlertDays)}
                    min={0}
                    max={SSL_EXPIRY_MARKS.length - 1}
                    marks={SSL_EXPIRY_DISPLAY_MARKS}
                    onValueChange={(idx) => setField('sslExpiryAlertDays')(SSL_EXPIRY_MARKS[idx])}
                    formatValue={(idx) => t('daysCount', { count: SSL_EXPIRY_MARKS[idx] })}
                    valueParts={{
                      value: state.sslExpiryAlertDays,
                      suffix: ` ${t('unit', { count: state.sslExpiryAlertDays })}`,
                    }}
                    recommendedValue={SSL_EXPIRY_MARKS.indexOf(RECOMMENDED_SSL_EXPIRY_DAYS)}
                    disabled={optionsDisabled}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
