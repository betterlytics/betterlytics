"use client";

import { useState, useEffect, useTransition, startTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Loader2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DashboardSettingsUpdate } from "@/entities/settings";
import { updateDashboardSettingsAction, resetDashboardSettingsAction } from "@/app/actions/settings";
import { useSettings } from "@/contexts/SettingsProvider";
import { useDashboardId } from "@/hooks/use-dashboard-id";
import DisplaySettings from "@/components/settings/DisplaySettings";
import DataSettings from "@/components/settings/DataSettings";
import ReportSettings from "@/components/settings/ReportSettings";
import AlertSettings from "@/components/settings/AlertSettings";

interface SettingsTabConfig {
  id: string;
  label: string;
  component: React.ComponentType<{
    formData: DashboardSettingsUpdate;
    onUpdate: (updates: Partial<DashboardSettingsUpdate>) => void;
  }>;
}

const SETTINGS_TABS: SettingsTabConfig[] = [
  {
    id: "display",
    label: "Display",
    component: DisplaySettings,
  },
  {
    id: "data",
    label: "Data",
    component: DataSettings,
  },
  {
    id: "reports",
    label: "Reports",
    component: ReportSettings,
  },
  {
    id: "alerts",
    label: "Alerts",
    component: AlertSettings,
  },
];

export default function SettingsPageClient() {
  const dashboardId = useDashboardId();
  const { settings, refreshSettings } = useSettings();
  const [formData, setFormData] = useState<DashboardSettingsUpdate>({});
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0].id);
  const [isPendingSave, startTransitionSave] = useTransition();
  const [isPendingReset, startTransitionReset] = useTransition();

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  const handleUpdate = (updates: Partial<DashboardSettingsUpdate>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    startTransitionSave(async () => {
      try {
        await updateDashboardSettingsAction(dashboardId, formData);
        await refreshSettings();
        toast.success("Settings saved successfully");
      } catch (error) {
        toast.error("Failed to save settings");
      }
    });
  };

  const handleReset = () => {
    startTransitionReset(async () => {
      try {
        await resetDashboardSettingsAction(dashboardId);
        await refreshSettings();
        toast.success("Settings reset to defaults");
      } catch (error) {
        toast.error("Failed to reset settings");
      }
    });
  };

  if (!settings) {
    return (
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-[1000]">
        <div className="flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-accent border-t-primary rounded-full animate-spin mb-2"></div>
          <p className="text-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Settings</h1>
        <p className="text-muted-foreground">
          Configure your dashboard preferences and data collection settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full grid-cols-${SETTINGS_TABS.length}`}>
          {SETTINGS_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SETTINGS_TABS.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id}>
              <Component formData={formData} onUpdate={handleUpdate} />
            </TabsContent>
          );
        })}

        <div className="flex justify-between pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={isPendingReset || isPendingSave}
              >
                {isPendingReset ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Reset Settings to Defaults
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset all settings to their default values? This action cannot be undone and will:
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>Reset all display preferences</li>
                  <li>Clear all report recipients</li>
                  <li>Reset data retention and alert settings</li>
                  <li>Lose any custom configurations</li>
                </ul>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPendingReset}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleReset}
                  disabled={isPendingReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPendingReset ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Reset Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            onClick={handleSave}
            disabled={isPendingSave || isPendingReset}
          >
            {isPendingSave ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </Tabs>
    </div>
  );
} 