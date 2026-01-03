'use client';

import { Plus } from 'lucide-react';
import SettingsSection from '@/components/SettingsSection';
import SettingsPageHeader from '@/components/SettingsPageHeader';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { use, useState, useTransition } from 'react';
import { isIP } from 'is-ip';
import isCidr from 'is-cidr';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { saveSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import { toast } from 'sonner';
import { DEFAULT_SITE_CONFIG_VALUES, type SiteConfig } from '@/entities/dashboard/siteConfig.entities';

interface RulesSettingsProps {
  siteConfigPromise: Promise<SiteConfig | null>;
}

export default function RulesSettings({ siteConfigPromise }: RulesSettingsProps) {
  const initialSiteConfig = use(siteConfigPromise) ?? DEFAULT_SITE_CONFIG_VALUES;
  const dashboardId = useDashboardId();
  const t = useTranslations('components.dashboardSettingsDialog.data');
  const tSave = useTranslations('components.dashboardSettingsDialog');

  // Site Rules state
  const [enforceDomain, setEnforceDomain] = useState(initialSiteConfig.enforceDomain);
  const [isEnforceDomainPending, startEnforceDomainTransition] = useTransition();

  const handleEnforceDomainChange = (value: boolean) => {
    setEnforceDomain(value);
    startEnforceDomainTransition(async () => {
      try {
        await saveSiteConfigAction(dashboardId, { enforceDomain: value });
        toast.success(tSave('toastSuccess'));
      } catch {
        setEnforceDomain(!value); // Revert on error
        toast.error(tSave('toastError'));
      }
    });
  };

  // IP Blacklist state
  const [blacklistedIps, setBlacklistedIps] = useState<string[]>(initialSiteConfig.blacklistedIps);
  const [newIp, setNewIp] = useState('');
  const [ipError, setIpError] = useState('');
  const [isBlacklistPending, startBlacklistTransition] = useTransition();

  const addIp = () => {
    const ip = newIp.trim();
    if (!ip) return;
    if (!(isIP(ip) || isCidr(ip))) {
      setIpError(t('blacklistedIps.addIpError'));
      return;
    }

    const newList = Array.from(new Set([...blacklistedIps, ip]));
    setBlacklistedIps(newList);
    setNewIp('');
    setIpError('');

    // Auto-save
    startBlacklistTransition(async () => {
      try {
        await saveSiteConfigAction(dashboardId, { blacklistedIps: newList });
        toast.success(tSave('toastSuccess'));
      } catch {
        setBlacklistedIps(blacklistedIps); // Revert on error
        toast.error(tSave('toastError'));
      }
    });
  };

  const removeIp = (ip: string) => {
    const newList = blacklistedIps.filter((x) => x !== ip);
    setBlacklistedIps(newList);

    // Auto-save
    startBlacklistTransition(async () => {
      try {
        await saveSiteConfigAction(dashboardId, { blacklistedIps: newList });
        toast.success(tSave('toastSuccess'));
      } catch {
        setBlacklistedIps(blacklistedIps); // Revert on error
        toast.error(tSave('toastError'));
      }
    });
  };

  return (
    <div>
      <SettingsPageHeader title={t('siteRules.title')} />

      <div className='space-y-12'>
        <SettingsSection
          title={t('siteRules.enforceDomain')}
          description={t('siteRules.enforceDomainDescription')}
        >
          <div className='bg-card flex items-center justify-between gap-4 rounded-md border px-3 py-2'>
            <span className='text-sm'>{t('siteRules.enableValidation')}</span>
            <Switch
              id='enforce-domain'
              className='cursor-pointer'
              aria-label={t('siteRules.enforceDomain')}
              checked={enforceDomain}
              disabled={isEnforceDomainPending}
              onCheckedChange={handleEnforceDomainChange}
            />
          </div>
        </SettingsSection>

        <SettingsSection title={t('blacklistedIps.title')} description={t('blacklistedIps.description')}>
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
                disabled={isBlacklistPending}
              />
              <Button
                type='button'
                variant='outline'
                onClick={addIp}
                className='cursor-pointer gap-2'
                disabled={isBlacklistPending || (!!newIp.trim() && !(isIP(newIp.trim()) || isCidr(newIp.trim())))}
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
                          disabled={isBlacklistPending}
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
        </SettingsSection>
      </div>
    </div>
  );
}
