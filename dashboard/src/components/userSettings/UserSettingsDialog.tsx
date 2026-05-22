'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, BarChart3, Receipt, Settings, Shield, User } from 'lucide-react';
import UserProfileSettings from '@/components/userSettings/UserProfileSettings';
import UserPreferencesSettings from '@/components/userSettings/UserPreferencesSettings';
import UserSecuritySettings from '@/components/userSettings/UserSecuritySettings';
import UserDangerZoneSettings from '@/components/userSettings/UserDangerZoneSettings';
import UserUsageSettings from '@/components/userSettings/UserUsageSettings';
import UserBillingHistory from '@/components/userSettings/UserBillingHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClientFeatureFlags } from '@/hooks/use-client-feature-flags';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  group: 'account' | 'preferences' | 'billing';
  render: (props: { closeDialog: () => void }) => React.ReactNode;
  disabled?: boolean;
}

export default function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const tDialog = useTranslations('components.userSettings.dialog');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='h-[85vh] max-h-[760px] w-[95vw] max-w-[1100px] gap-0 overflow-hidden p-0 sm:max-w-[1100px]'>
        <DialogHeader className='sr-only'>
          <DialogTitle>{tDialog('title')}</DialogTitle>
          <DialogDescription>{tDialog('description')}</DialogDescription>
        </DialogHeader>

        <UserSettingsDialogContent closeDialog={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface UserSettingsDialogContentProps {
  closeDialog: () => void;
}

function UserSettingsDialogContent({ closeDialog }: UserSettingsDialogContentProps) {
  const { isFeatureFlagEnabled } = useClientFeatureFlags();
  const tTabs = useTranslations('components.userSettings.tabs');
  const tGroups = useTranslations('components.userSettings.groups');

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'profile',
        label: tTabs('profile'),
        icon: User,
        group: 'account',
        render: () => <UserProfileSettings />,
      },
      {
        id: 'security',
        label: tTabs('security'),
        icon: Shield,
        group: 'account',
        render: () => <UserSecuritySettings />,
      },
      {
        id: 'preferences',
        label: tTabs('preferences'),
        icon: Settings,
        group: 'preferences',
        render: () => <UserPreferencesSettings />,
      },
      {
        id: 'usage',
        label: tTabs('usage'),
        icon: BarChart3,
        group: 'billing',
        disabled: !isFeatureFlagEnabled('enableBilling'),
        render: ({ closeDialog }) => <UserUsageSettings onCloseDialog={closeDialog} />,
      },
      {
        id: 'billing',
        label: tTabs('billing'),
        icon: Receipt,
        group: 'billing',
        disabled: !isFeatureFlagEnabled('enableBilling'),
        render: () => <UserBillingHistory />,
      },
      {
        id: 'danger',
        label: tTabs('danger'),
        icon: AlertTriangle,
        group: 'account',
        render: () => <UserDangerZoneSettings />,
      },
    ],
    [tTabs, isFeatureFlagEnabled],
  );

  const availableTabs = tabs.filter((tab) => !tab.disabled);
  const [activeTabId, setActiveTabId] = useState<string>(availableTabs[0].id);
  const activeTab = availableTabs.find((tab) => tab.id === activeTabId) ?? availableTabs[0];

  const groupedTabs = useMemo(() => {
    const groups: Array<{ key: TabConfig['group']; label: string; tabs: TabConfig[] }> = [
      { key: 'account', label: tGroups('account'), tabs: [] },
      { key: 'preferences', label: tGroups('preferences'), tabs: [] },
      { key: 'billing', label: tGroups('billing'), tabs: [] },
    ];
    for (const tab of availableTabs) {
      groups.find((g) => g.key === tab.group)?.tabs.push(tab);
    }
    return groups.filter((g) => g.tabs.length > 0);
  }, [availableTabs, tGroups]);

  return (
    <Tabs
      value={activeTabId}
      onValueChange={setActiveTabId}
      orientation='vertical'
      className='flex h-full min-h-0 flex-row gap-0'
    >
      <TabsList className='bg-muted/30 flex h-full w-56 flex-shrink-0 flex-col items-stretch justify-start gap-4 overflow-y-auto rounded-none border-r px-2 py-6'>
        {groupedTabs.map((group) => (
          <div key={group.key} className='flex flex-col gap-0.5'>
            <div className='text-muted-foreground px-3 pb-1 text-xs font-medium tracking-wider uppercase'>
              {group.label}
            </div>
            {group.tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    'data-[state=active]:bg-accent data-[state=active]:text-accent-foreground',
                    'flex h-auto w-full cursor-pointer items-center justify-start gap-2.5 rounded-md border-0 px-3 py-1.5 text-sm font-medium transition-colors data-[state=active]:shadow-none',
                  )}
                >
                  <Icon className='h-4 w-4' />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </div>
        ))}
      </TabsList>

      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        <header className='border-b px-8 py-5'>
          <h2 className='text-xl font-semibold'>{activeTab.label}</h2>
        </header>
        <ScrollArea className='flex-1'>
          <div className='px-8 py-6'>
            {availableTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className='mt-0'>
                {tab.render({ closeDialog })}
              </TabsContent>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Tabs>
  );
}
