'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreditCard, Settings, User } from 'lucide-react';
import UserAccountSettings from '@/components/userSettings/UserAccountSettings';
import UserPreferencesSettings from '@/components/userSettings/UserPreferencesSettings';
import UserBillingSettings from '@/components/userSettings/UserBillingSettings';
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
  render: (props: { closeDialog: () => void }) => React.ReactNode;
  disabled?: boolean;
}

export default function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const tDialog = useTranslations('components.userSettings.dialog');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='h-[90vh] max-h-[900px] w-[95vw] max-w-[1100px] gap-0 overflow-hidden p-0 sm:max-w-[1100px]'>
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

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'account',
        label: tTabs('account'),
        icon: User,
        render: () => <UserAccountSettings />,
      },
      {
        id: 'preferences',
        label: tTabs('preferences'),
        icon: Settings,
        render: () => <UserPreferencesSettings />,
      },
      {
        id: 'billing',
        label: tTabs('billing'),
        icon: CreditCard,
        disabled: !isFeatureFlagEnabled('enableBilling'),
        render: ({ closeDialog }) => <UserBillingSettings onCloseDialog={closeDialog} />,
      },
    ],
    [tTabs, isFeatureFlagEnabled],
  );

  const availableTabs = tabs.filter((tab) => !tab.disabled);
  const [activeTabId, setActiveTabId] = useState<string>(availableTabs[0].id);
  const activeTab = availableTabs.find((tab) => tab.id === activeTabId) ?? availableTabs[0];

  return (
    <Tabs
      value={activeTabId}
      onValueChange={setActiveTabId}
      orientation='vertical'
      className='flex h-full min-h-0 flex-row gap-0'
    >
      <TabsList className='bg-muted/30 flex h-full w-56 flex-shrink-0 flex-col items-stretch justify-start gap-1 overflow-y-auto rounded-none border-r px-2 py-6'>
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                'data-[state=active]:bg-accent data-[state=active]:text-accent-foreground',
                'flex h-auto w-full flex-none cursor-pointer items-center justify-start gap-2.5 rounded-md border-0 px-3 py-2 text-sm font-medium transition-colors data-[state=active]:shadow-none',
              )}
            >
              <Icon className='h-4 w-4' />
              <span>{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <ScrollArea className='min-h-0 min-w-0 flex-1'>
        <div className='px-8 pt-8 pb-10'>
          <h2 className='mb-8 text-2xl font-semibold'>{activeTab.label}</h2>
          {availableTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className='mt-0'>
              {tab.render({ closeDialog })}
            </TabsContent>
          ))}
        </div>
      </ScrollArea>
    </Tabs>
  );
}
