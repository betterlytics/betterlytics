'use client';

import { createContext, useContext, useState, useTransition, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { updateDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { saveSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import type { DashboardSettingsUpdate } from '@/entities/dashboard/dashboardSettings.entities';
import type { SiteConfigUpdate } from '@/entities/dashboard/siteConfig.entities';
import useIsChanged from '@/hooks/use-is-changed';
import { useTranslations } from 'next-intl';

type SettingsFormContextType = {
  dashboardSettings: DashboardSettingsUpdate;
  updateDashboardSettings: (updates: Partial<DashboardSettingsUpdate>) => void;

  siteConfig: SiteConfigUpdate | null;
  updateSiteConfig: (updates: Partial<SiteConfigUpdate>) => void;

  hasChanges: boolean;

  save: () => Promise<void>;
  isPending: boolean;

  isLoading: boolean;
};

const SettingsFormContext = createContext<SettingsFormContextType | null>(null);

export function useSettingsForm() {
  const context = useContext(SettingsFormContext);
  if (!context) {
    throw new Error('useSettingsForm must be used within a SettingsFormProvider');
  }
  return context;
}

type SettingsFormProviderProps = {
  children: ReactNode;
  initialSiteConfig: SiteConfigUpdate | null;
};

export function SettingsFormProvider({ children, initialSiteConfig }: SettingsFormProviderProps) {
  const dashboardId = useDashboardId();
  const { settings, refreshSettings } = useSettings();
  const t = useTranslations('components.dashboardSettingsDialog');

  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettingsUpdate>({});

  const [siteConfig, setSiteConfig] = useState<SiteConfigUpdate | null>(initialSiteConfig);
  const [initialSiteConfigState, setInitialSiteConfigState] = useState<SiteConfigUpdate | null>(initialSiteConfig);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (settings) {
      setDashboardSettings({ ...settings });
    }
  }, [settings]);

  const isDashboardSettingsChanged = useIsChanged(dashboardSettings, settings);
  const isSiteConfigChanged = useIsChanged<SiteConfigUpdate>(siteConfig, initialSiteConfigState);
  const hasChanges = isDashboardSettingsChanged || isSiteConfigChanged;

  const updateDashboardSettings = useCallback((updates: Partial<DashboardSettingsUpdate>) => {
    setDashboardSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateSiteConfig = useCallback((updates: Partial<SiteConfigUpdate>) => {
    setSiteConfig((prev) => (prev ? { ...prev, ...updates } : updates));
  }, []);

  const save = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const tasks: Promise<unknown>[] = [];

          if (isDashboardSettingsChanged) {
            tasks.push(updateDashboardSettingsAction(dashboardId, dashboardSettings));
          }

          if (isSiteConfigChanged && siteConfig) {
            tasks.push(saveSiteConfigAction(dashboardId, siteConfig));
          }

          await Promise.all(tasks);
          await refreshSettings();

          if (isSiteConfigChanged && siteConfig) {
            setInitialSiteConfigState(siteConfig);
          }

          toast.success(t('toastSuccess'));
          resolve();
        } catch {
          toast.error(t('toastError'));
          reject();
        }
      });
    });
  }, [
    dashboardId,
    dashboardSettings,
    siteConfig,
    isDashboardSettingsChanged,
    isSiteConfigChanged,
    refreshSettings,
    t,
  ]);

  const isLoading = !settings;

  return (
    <SettingsFormContext.Provider
      value={{
        dashboardSettings,
        updateDashboardSettings,
        siteConfig,
        updateSiteConfig,
        hasChanges,
        save,
        isPending,
        isLoading,
      }}
    >
      {children}
    </SettingsFormContext.Provider>
  );
}
