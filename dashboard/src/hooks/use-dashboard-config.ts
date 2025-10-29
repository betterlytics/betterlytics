'use client';

import { useCallback, useEffect, useState } from 'react';
import { getDashboardConfigAction } from '@/app/actions/siteConfig';
import type { DashboardConfigUpdate } from '@/entities/dashboardConfig';
import { useDashboardId } from '@/hooks/use-dashboard-id';

type UseDashboardConfigResult = {
  config: DashboardConfigUpdate | null;
  initialConfig: DashboardConfigUpdate | null;
  isLoading: boolean;
  error: string | null;
  setConfig: (next: DashboardConfigUpdate) => void;
  refreshConfig: () => Promise<void>;
  commitInitialConfig: () => void;
};

export function useDashboardConfig(): UseDashboardConfigResult {
  const dashboardId = useDashboardId();
  const [config, setConfig] = useState<DashboardConfigUpdate | null>(null);
  const [initialConfig, setInitialConfig] = useState<DashboardConfigUpdate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cfg = await getDashboardConfigAction(dashboardId);
      if (cfg) {
        const updateShape: DashboardConfigUpdate = {
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
