'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSiteConfigAction } from '@/app/actions/siteConfig';
import type { SiteConfigUpdate } from '@/entities/siteConfig';
import { useDashboardId } from '@/hooks/use-dashboard-id';

type UseSiteConfigResult = {
  config: SiteConfigUpdate | null;
  initialConfig: SiteConfigUpdate | null;
  isLoading: boolean;
  error: string | null;
  setConfig: (next: SiteConfigUpdate) => void;
  refreshConfig: () => Promise<void>;
  commitInitialConfig: () => void;
};

export function useSiteConfig(): UseSiteConfigResult {
  const dashboardId = useDashboardId();
  const [config, setConfig] = useState<SiteConfigUpdate | null>(null);
  const [initialConfig, setInitialConfig] = useState<SiteConfigUpdate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cfg = await getSiteConfigAction(dashboardId);
      if (cfg) {
        const updateShape: SiteConfigUpdate = {
          enforceDomain: cfg.enforceDomain,
          blacklistedIps: cfg.blacklistedIps,
        };
        setConfig(updateShape);
        setInitialConfig(updateShape);
      } else {
        setConfig({});
        setInitialConfig({});
      }
    } catch (e) {
      setError('Failed to load dashboard config');
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId]);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const commitInitialConfig = useCallback(() => {
    if (config) {
      setInitialConfig(config);
    }
  }, [config]);

  return { config, initialConfig, isLoading, error, setConfig, refreshConfig, commitInitialConfig };
}
