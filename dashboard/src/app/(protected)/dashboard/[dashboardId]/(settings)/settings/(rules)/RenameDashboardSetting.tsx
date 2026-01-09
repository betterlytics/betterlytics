'use client';

import SettingsSection from '../SettingsSection';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { updateDashboardDomainAction } from '@/app/actions/dashboard/dashboard.action';
import { toast } from 'sonner';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { Button } from '@/components/ui/button';
import { domainValidation } from '@/entities/dashboard/dashboard.entities';
import type { Dashboard } from '@/entities/dashboard/dashboard.entities';
import { useRouter } from 'next/navigation';
import { PrefixInput } from '@/components/inputs/PrefixInput';

interface RenameDashboardSettingProps {
  initialDashboard: Dashboard;
}

export default function RenameDashboardSetting({ initialDashboard }: RenameDashboardSettingProps) {
  const dashboardId = useDashboardId();
  const t = useTranslations('components.dashboardSettingsDialog.data.siteRules.rename');
  const tValidation = useTranslations('components.dashboards.createDialog');
  const tMisc = useTranslations('misc');
  const router = useRouter();

  const [domain, setDomain] = useState(initialDashboard.domain);
  const [isPending, startTransition] = useTransition();

  const hasChanged = domain.trim() !== initialDashboard.domain;

  const handleSave = () => {
    const result = domainValidation.safeParse(domain);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || tValidation('errors.invalidDomain'));
      return;
    }

    startTransition(async () => {
      try {
        await updateDashboardDomainAction(dashboardId, result.data);
        toast.success(t('success'));
        router.refresh();
      } catch {
        router.refresh();
        toast.error(t('error'));
      }
    });
  };

  return (
    <SettingsSection title={t('title')} description={t('description')}>
      <div className='space-y-3'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <div className='flex-1'>
            <PermissionGate>
              {(disabled) => (
                <PrefixInput
                  id='domain'
                  name='domain'
                  type='text'
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={disabled || isPending}
                  prefix='https://'
                />
              )}
            </PermissionGate>
          </div>
          <PermissionGate>
            {(disabled) => (
              <Button
                onClick={handleSave}
                disabled={disabled || isPending || !hasChanged}
                className='cursor-pointer'
              >
                {isPending ? tMisc('saving') : tMisc('save')}
              </Button>
            )}
          </PermissionGate>
        </div>
        <p className='text-muted-foreground pl-1 text-xs'>{t('info')}</p>
      </div>
    </SettingsSection>
  );
}
