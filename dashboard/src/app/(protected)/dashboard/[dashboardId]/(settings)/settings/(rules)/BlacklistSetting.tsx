'use client';

import { Plus } from 'lucide-react';
import SettingsSection from '../SettingsSection';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { isIP } from 'is-ip';
import isCidr from 'is-cidr';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { saveSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import { toast } from 'sonner';
import { DEFAULT_SITE_CONFIG_VALUES, type SiteConfig } from '@/entities/dashboard/siteConfig.entities';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

interface BlacklistSettingProps {
  initialSiteConfig: SiteConfig | null;
}

export default function BlacklistSetting({ initialSiteConfig }: BlacklistSettingProps) {
  const config = initialSiteConfig ?? DEFAULT_SITE_CONFIG_VALUES;
  const dashboardId = useDashboardId();
  const t = useTranslations('components.dashboardSettingsDialog');

  const [blacklistedIps, setBlacklistedIps] = useState<string[]>(config.blacklistedIps);
  const [newIp, setNewIp] = useState('');
  const [ipError, setIpError] = useState('');
  const [isPending, startTransition] = useTransition();

  const updateBlacklist = (newList: string[]) => {
    setBlacklistedIps(newList);

    startTransition(async () => {
      try {
        await saveSiteConfigAction(dashboardId, { blacklistedIps: newList });
        toast.success(t('toastSuccess'));
      } catch {
        setBlacklistedIps(blacklistedIps);
        toast.error(t('toastError'));
      }
    });
  };

  const addIp = () => {
    const ip = newIp.trim();
    if (!ip) return;
    if (!(isIP(ip) || isCidr(ip))) {
      setIpError(t('data.blacklistedIps.addIpError'));
      return;
    }

    setNewIp('');
    setIpError('');

    updateBlacklist(Array.from(new Set([...blacklistedIps, ip])));
  };

  const removeIp = (ip: string) => {
    updateBlacklist(blacklistedIps.filter((x) => x !== ip));
  };

  return (
    <SettingsSection title={t('data.blacklistedIps.title')} description={t('data.blacklistedIps.description')}>
      <div className='space-y-4'>
        <div className='flex gap-2'>
          <PermissionGate wrapperClassName='w-full'>
            {(disabled) => (
              <Input
                id='blacklisted-ip-input'
                placeholder={t('data.blacklistedIps.addIpPlaceholder')}
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
                disabled={disabled || isPending}
              />
            )}
          </PermissionGate>
          <PermissionGate>
            {(disabled) => (
              <Button
                type='button'
                variant='outline'
                onClick={addIp}
                className='cursor-pointer gap-2'
                disabled={
                  disabled || isPending || (!!newIp.trim() && !(isIP(newIp.trim()) || isCidr(newIp.trim())))
                }
              >
                <Plus className='h-4 w-4' />
                {t('data.blacklistedIps.addIp')}
              </Button>
            )}
          </PermissionGate>
        </div>
        {ipError ? (
          <p id='blacklisted-ip-error' className='text-destructive text-xs'>
            {ipError}
          </p>
        ) : null}

        <div className='space-y-2'>
          <div className='border-border bg-muted/30 h-[200px] overflow-y-auto rounded-md border p-2'>
            {blacklistedIps.length > 0 ? (
              <div className='space-y-2'>
                {blacklistedIps.map((ip) => (
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
                      disabled={isPending}
                    >
                      {t('data.blacklistedIps.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex h-full items-center justify-center'>
                <p className='text-muted-foreground text-sm'>{t('data.blacklistedIps.noIps')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
