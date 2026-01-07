'use client';

import SettingsSection from '../SettingsSection';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { useState, useTransition } from 'react';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { saveSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import { toast } from 'sonner';
import { DEFAULT_SITE_CONFIG_VALUES, type SiteConfig } from '@/entities/dashboard/siteConfig.entities';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

interface EnforceDomainSettingProps {
  initialSiteConfig: SiteConfig | null;
}

export default function EnforceDomainSetting({ initialSiteConfig }: EnforceDomainSettingProps) {
  const config = initialSiteConfig ?? DEFAULT_SITE_CONFIG_VALUES;
  const dashboardId = useDashboardId();
  const t = useTranslations('components.dashboardSettingsDialog');

  const [enforceDomain, setEnforceDomain] = useState(config.enforceDomain);
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: boolean) => {
    setEnforceDomain(value);
    startTransition(async () => {
      try {
        await saveSiteConfigAction(dashboardId, { enforceDomain: value });
        toast.success(t('toastSuccess'));
      } catch {
        setEnforceDomain(!value);
        toast.error(t('toastError'));
      }
    });
  };

  return (
    <SettingsSection title={t('data.siteRules.enforceDomain')}>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <span className='text-sm font-medium'>{t('data.siteRules.enableValidation')}</span>
          <p className='text-muted-foreground text-xs'>{t('data.siteRules.enableValidationDescription')}</p>
        </div>
        <PermissionGate>
          {(disabled) => (
            <Switch
              id='enforce-domain'
              className='cursor-pointer'
              aria-label={t('data.siteRules.enforceDomain')}
              checked={enforceDomain}
              disabled={isPending || disabled}
              onCheckedChange={handleChange}
            />
          )}
        </PermissionGate>
      </div>
    </SettingsSection>
  );
}
