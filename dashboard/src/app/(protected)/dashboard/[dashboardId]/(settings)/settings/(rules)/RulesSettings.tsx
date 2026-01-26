'use client';

import SettingsPageHeader from '../SettingsPageHeader';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import type { SiteConfig } from '@/entities/dashboard/siteConfig.entities';
import type { Dashboard } from '@/entities/dashboard/dashboard.entities';
import EnforceDomainSetting from './EnforceDomainSetting';
import BlacklistSetting from './BlacklistSetting';
import RenameDashboardSetting from './RenameDashboardSetting';

interface RulesSettingsProps {
  siteConfigPromise: Promise<SiteConfig | null>;
  dashboardPromise: Promise<Dashboard>;
}

export default function RulesSettings({ siteConfigPromise, dashboardPromise }: RulesSettingsProps) {
  const siteConfig = use(siteConfigPromise);
  const dashboard = use(dashboardPromise);
  const t = useTranslations('components.dashboardSettingsDialog');

  return (
    <div>
      <SettingsPageHeader title={t('data.siteRules.title')} />

      <div className='space-y-12'>
        <EnforceDomainSetting initialSiteConfig={siteConfig} />
        <BlacklistSetting initialSiteConfig={siteConfig} />
        <RenameDashboardSetting initialDashboard={dashboard} />
      </div>
    </div>
  );
}
