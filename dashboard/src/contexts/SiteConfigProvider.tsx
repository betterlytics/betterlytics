'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SiteConfig } from '@/entities/dashboard/siteConfig.entities';
import { getSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';

type SiteConfigContextType = {
  siteConfig: SiteConfig | null;
  refreshSiteConfig: () => Promise<void>;
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (!context) throw new Error('useSiteConfig must be used within SiteConfigProvider');
  return context;
}

type Props = {
  initialSiteConfig: SiteConfig | null;
  dashboardId: string;
  children: React.ReactNode;
};

export function SiteConfigProvider({ initialSiteConfig, dashboardId, children }: Props) {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(initialSiteConfig);

  const refreshSiteConfig = useCallback(async () => {
    try {
      const updated = await getSiteConfigAction(dashboardId);
      setSiteConfig(updated);
    } catch (error) {
      console.error('Failed to refresh site config:', error);
    }
  }, [dashboardId]);

  return <SiteConfigContext.Provider value={{ siteConfig, refreshSiteConfig }}>{children}</SiteConfigContext.Provider>;
}
