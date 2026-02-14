'use client';

import { Bell, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LabeledSlider } from '@/components/inputs/LabeledSlider';
import { SettingToggle } from '@/components/inputs/SettingToggle';
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
          {state.alertsEnabled && (
            <span className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
              {t('enabled')}
            </span>
          )}
          <ChevronDown className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]/alerts:rotate-180' />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden'>
        <div className='space-y-5 pt-4'>
          <SettingToggle
            id='alerts-enabled'
            label={
              <>
                {t('enableAlerts')} <span className='text-muted-foreground font-normal'>({userEmail})</span>
              </>
            }
            checked={state.alertsEnabled}
            onCheckedChange={setField('alertsEnabled')}
            disabled={isPending}
          />

          {state.alertsEnabled && (
            <div className='space-y-5 pl-1'>
              <SettingToggle
                id='alert-on-down'
                label={t('onDown')}
                checked={state.alertOnDown}
                onCheckedChange={setField('alertOnDown')}
                disabled={isPending}
              />

              <SettingToggle
                id='alert-on-recovery'
                label={t('onRecovery')}
                checked={state.alertOnRecovery}
                onCheckedChange={setField('alertOnRecovery')}
                disabled={isPending}
              />

              <SettingToggle
                id='alert-on-ssl-expiry'
                label={t('onSslExpiry')}
                checked={sslMonitoringEnabled && state.alertOnSslExpiry}
                onCheckedChange={setField('alertOnSslExpiry')}
                disabled={isPending || !sslMonitoringEnabled}
                disabledTooltip={!sslMonitoringEnabled ? t('sslExpiryDisabledTooltip') : undefined}
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
                    disabled={isPending}
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
