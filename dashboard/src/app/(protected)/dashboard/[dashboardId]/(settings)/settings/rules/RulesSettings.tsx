'use client';

import SettingsPageHeader from '@/components/SettingsPageHeader';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import type { SiteConfig } from '@/entities/dashboard/siteConfig.entities';
import EnforceDomainSetting from './EnforceDomainSetting';
import BlacklistSetting from './BlacklistSetting';

interface RulesSettingsProps {
  siteConfigPromise: Promise<SiteConfig | null>;
}

export default function RulesSettings({ siteConfigPromise }: RulesSettingsProps) {
  const siteConfig = use(siteConfigPromise);
  const t = useTranslations('components.dashboardSettingsDialog');

  return (
    <div>
      <SettingsPageHeader title={t('data.siteRules.title')} />

      <div className='space-y-12'>
        <EnforceDomainSetting initialSiteConfig={siteConfig} />
        <BlacklistSetting initialSiteConfig={siteConfig} />
      </div>
    </div>
  );
}
