'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUpRight, Bug, BookOpen, CreditCard, HelpCircle, Mail, Settings, User } from 'lucide-react';
import UserAccountSettings from '@/components/userSettings/UserAccountSettings';
import UserPreferencesSettings from '@/components/userSettings/UserPreferencesSettings';
import UserBillingSettings from '@/components/userSettings/UserBillingSettings';
import { BugReportDialog } from '@/components/bugReport/BugReportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ExternalLink from '@/components/ExternalLink';
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
      <DialogContent className='h-[90vh] max-h-[900px] w-[95vw] max-w-[1000px] gap-0 overflow-hidden p-0 sm:max-w-[1000px]'>
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
  const isBugReportsEnabled = isFeatureFlagEnabled('enableBugReports');
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const openBugReport = () => {
    setIsHelpOpen(false);
    setIsBugReportOpen(true);
  };

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
      className='flex h-full min-h-0 flex-col gap-0 md:flex-row'
    >
      {/* Desktop sidebar — hidden on mobile */}
      <div className='bg-muted/30 hidden h-full w-56 flex-shrink-0 flex-col border-r md:flex'>
        <TabsList className='flex w-full flex-1 flex-col items-stretch justify-start gap-1 overflow-y-auto rounded-none bg-transparent px-2 py-4'>
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
                <Icon className='h-4 w-4 flex-shrink-0' />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className='px-2 pb-3'>
          <Popover open={isHelpOpen} onOpenChange={setIsHelpOpen}>
            <PopoverTrigger asChild>
              <button
                type='button'
                className='text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors'
              >
                <HelpCircle className='h-3.5 w-3.5 flex-shrink-0' />
                <span>Need help?</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side='top' align='start' sideOffset={4} className='w-56 p-1'>
              <ExternalLink
                href='https://betterlytics.io/docs'
                className='hover:bg-accent flex items-center gap-2.5 rounded-md px-3 py-2 text-sm no-underline'
                onClick={() => setIsHelpOpen(false)}
              >
                <BookOpen className='h-4 w-4' />
                <span className='flex-1'>Documentation</span>
                <ArrowUpRight className='text-muted-foreground h-3.5 w-3.5' />
              </ExternalLink>
              {isBugReportsEnabled && (
                <button
                  type='button'
                  onClick={openBugReport}
                  className='hover:bg-accent flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm'
                >
                  <Bug className='h-4 w-4' />
                  <span>Report a bug</span>
                </button>
              )}
              <a
                href='mailto:support@betterlytics.io'
                className='hover:bg-accent flex items-center gap-2.5 rounded-md px-3 py-2 text-sm no-underline'
                onClick={() => setIsHelpOpen(false)}
              >
                <Mail className='h-4 w-4' />
                <span className='flex-1'>Contact support</span>
                <ArrowUpRight className='text-muted-foreground h-3.5 w-3.5' />
              </a>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Mobile-only header */}
      <div className='border-border border-b px-5 py-4 md:hidden'>
        <h2 className='text-lg font-semibold'>{activeTab.label}</h2>
      </div>

      {/* Mobile horizontal tab bar */}
      <TabsList className='border-border flex h-auto w-full flex-shrink-0 justify-start overflow-x-auto rounded-none border-b bg-transparent p-0 px-2 md:hidden'>
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'text-muted-foreground hover:text-foreground bg-transparent dark:bg-transparent',
                'data-[state=active]:text-foreground data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent',
                'data-[state=active]:border-foreground dark:data-[state=active]:border-foreground border-x-0 border-t-0 border-b-2 border-transparent',
                'flex flex-none flex-shrink-0 cursor-pointer items-center gap-2 rounded-none px-3 py-3 text-sm font-medium shadow-none transition-colors data-[state=active]:shadow-none',
              )}
            >
              <Icon className='h-4 w-4' />
              <span>{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {isBugReportsEnabled && <BugReportDialog open={isBugReportOpen} onOpenChange={setIsBugReportOpen} />}

      <ScrollArea className='min-h-0 min-w-0 flex-1'>
        <div className='px-5 pt-6 pb-8 md:px-8 md:pt-8 md:pb-10'>
          <h2 className='mb-8 hidden text-2xl font-semibold md:block'>{activeTab.label}</h2>
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
