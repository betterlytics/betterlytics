'use client';

import { use, useState } from 'react';
import { DashboardSettingsUpdate } from '@/entities/dashboard/dashboardSettings.entities';
import type { SiteConfig, SiteConfigUpdate } from '@/entities/dashboard/siteConfig.entities';
import useIsChanged from '@/hooks/use-is-changed';
import DataDashboardSettings from '@/components/dashboardSettings/DashboardDataSettings';

type DataSettingsProps = {
  siteConfigPromise: Promise<SiteConfig | null>;
};

export default function DataSettings({ siteConfigPromise }: DataSettingsProps) {
  const siteConfig = use(siteConfigPromise);

  const [formData, setFormData] = useState<DashboardSettingsUpdate>({});
  const [config, setConfig] = useState<SiteConfigUpdate | null>(siteConfig);

  const isConfigChanged = useIsChanged<SiteConfigUpdate>(config, siteConfig);

  if (siteConfig === null || config === null) {
    return null;
  }

  return (
    <DataDashboardSettings
      dashboardSettings={formData}
      onUpdate={setFormData}
      siteConfig={config}
      onConfigChange={setConfig}
    />
  );
}
