'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ban, Database, Shield, Plus } from 'lucide-react';
import { DashboardSettingsUpdate } from '@/entities/dashboardSettings';
import { DATA_RETENTION_PRESETS } from '@/utils/settingsUtils';
import SettingsCard from '@/components/SettingsCard';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { DashboardConfigUpdate } from '@/entities/dashboardConfig';
import { isIP } from 'is-ip';
import isCidr from 'is-cidr';

type DataSettingsProps = {
  dashboardSettings: DashboardSettingsUpdate;
  onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
  dashboardConfig: DashboardConfigUpdate;
  onConfigChange: (next: DashboardConfigUpdate) => void;
};

export default function DataSettings({
  dashboardSettings,
  onUpdate,
  dashboardConfig,
  onConfigChange,
}: DataSettingsProps) {
  const t = useTranslations('components.dashboardSettingsDialog.data');
  const [newIp, setNewIp] = useState('');
  const [ipError, setIpError] = useState('');

  const addIp = () => {
    const ip = newIp.trim();
    if (!ip) return;
    if (!(isIP(ip) || isCidr(ip))) {
      setIpError(t('blacklistedIps.addIpError'));
      return;
    }
    onConfigChange({
      ...dashboardConfig,
      blacklistedIps: Array.from(new Set([...(dashboardConfig.blacklistedIps || []), ip])),
    });
    setNewIp('');
    setIpError('');
  };

  const removeIp = (ip: string) => {
    onConfigChange({
      ...dashboardConfig,
      blacklistedIps: (dashboardConfig.blacklistedIps || []).filter((x) => x !== ip),
    });
  };

  return (
    <div className='space-y-6'>
      <SettingsCard icon={Database} title={t('title')} description={t('description')}>
        <div className='space-y-2'>
          <Label className='text-base'>{t('retentionLabel')}</Label>
          <p className='text-muted-foreground mb-2 text-sm'>{t('retentionHelp')}</p>
          <Select
            value={dashboardSettings.dataRetentionDays?.toString() || '365'}
            onValueChange={(value) => onUpdate({ dataRetentionDays: parseInt(value) })}
          >
            <SelectTrigger className='border-border w-full cursor-pointer'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_RETENTION_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value.toString()} className='cursor-pointer'>
                  {(() => {
                    try {
                      return t(`presets.${preset.i18nKey}`);
                    } catch {
                      return preset.fallback;
                    }
                  })()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SettingsCard>

      <SettingsCard icon={Shield} title={t('siteRules.title')} description={t('siteRules.description')}>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <Label htmlFor='enforce-domain' className='cursor-pointer text-base'>
              {t('siteRules.enforceDomain')}
            </Label>
            <p className='text-muted-foreground mt-1 text-sm'>{t('siteRules.enforceDomainDescription')}</p>
          </div>
          <Switch
            id='enforce-domain'
            className='cursor-pointer'
            aria-label={t('siteRules.enforceDomain')}
            checked={!!dashboardConfig.enforceDomain}
            onCheckedChange={(v) => onConfigChange({ ...dashboardConfig, enforceDomain: !!v })}
          />
        </div>
      </SettingsCard>

      <SettingsCard icon={Ban} title={t('blacklistedIps.title')} description={t('blacklistedIps.description')}>
        <div className='space-y-4'>
          <div className='flex gap-2'>
            <Input
              id='blacklisted-ip-input'
              placeholder={t('blacklistedIps.addIpPlaceholder')}
              value={newIp}
              onChange={(e) => {
                setNewIp(e.target.value);
                if (ipError) setIpError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addIp();
                }
              }}
              aria-invalid={!!ipError}
              aria-describedby={ipError ? 'blacklisted-ip-error' : undefined}
            />
            <Button
              type='button'
              variant='outline'
              onClick={addIp}
              className='cursor-pointer gap-2'
              disabled={!!newIp.trim() && !(isIP(newIp.trim()) || isCidr(newIp.trim()))}
            >
              <Plus className='h-4 w-4' />
              {t('blacklistedIps.addIp')}
            </Button>
          </div>
          {ipError ? (
            <p id='blacklisted-ip-error' className='text-destructive text-xs'>
              {ipError}
            </p>
          ) : null}

          <div className='space-y-2'>
            <div className='border-border bg-muted/30 h-[200px] overflow-y-auto rounded-md border p-2'>
              {(dashboardConfig.blacklistedIps || []).length > 0 ? (
                <div className='space-y-2'>
                  {(dashboardConfig.blacklistedIps || []).map((ip) => (
                    <div
                      key={ip}
                      className='border-border bg-background/20 hover:bg-accent/10 flex items-center justify-between rounded-md border px-3 py-2.5 transition-colors'
                    >
                      <span className='font-mono text-sm'>{ip}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:text-destructive cursor-pointer'
                        onClick={() => removeIp(ip)}
                      >
                        {t('blacklistedIps.remove')}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex h-full items-center justify-center'>
                  <p className='text-muted-foreground text-sm'>{t('blacklistedIps.noIps')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
