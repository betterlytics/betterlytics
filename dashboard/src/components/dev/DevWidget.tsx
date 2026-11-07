'use client';

import { useState, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { SUPPORTED_LANGUAGES, LANGUAGE_METADATA, type SupportedLanguages } from '@/constants/i18n';
import { updateDevSubscriptionAction } from '@/app/actions/dev.actions';
import {
  updateUserLanguageAction,
  updateUserThemeAction,
  updateUserTimezoneAction,
} from '@/app/actions/account/userSettings.action';
import { TimezoneSelect } from '@/components/userSettings/preferences/TimezoneSelect';
import { useUserSettings } from '@/contexts/UserSettingsProvider';
import { useUserSettingsMutation } from '@/hooks/use-user-settings-mutation';
import { PLAN_IDS, getPlan, type PlanId } from '@/lib/billing/catalog';
import { useRouter } from 'next/navigation';
import type { Theme } from '@prisma/client';

interface DevWidgetProps {
  initialPlanId: PlanId;
}

const PLAN_OPTIONS = PLAN_IDS.map((planId) => ({ value: planId, label: getPlan(planId).name }));

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function DevWidget({ initialPlanId }: DevWidgetProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>(initialPlanId);
  const settings = useUserSettings();
  const timezoneMutation = useUserSettingsMutation({ action: updateUserTimezoneAction });

  function handlePlanChange(planId: PlanId) {
    setCurrentPlanId(planId);
    startTransition(async () => {
      try {
        await updateDevSubscriptionAction(planId);
        toast.success(`Subscription changed to ${getPlan(planId).name}`);
        window.location.reload();
      } catch {
        toast.error('Failed to change subscription');
      }
    });
  }

  function handleLanguageChange(lang: string) {
    startTransition(async () => {
      await updateUserLanguageAction({ language: lang as SupportedLanguages });
      router.refresh();
    });
  }

  function handleThemeChange(value: string) {
    setTheme(value);
    startTransition(async () => {
      await updateUserThemeAction({ theme: value as Theme });
    });
  }

  return (
    <div className='fixed right-4 bottom-4 z-50'>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className='h-auto gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg'
          >
            <Wrench className='size-3.5' />
            Dev Tools
          </Button>
        </PopoverTrigger>
        <PopoverContent align='end' side='top' className='w-64'>
          <div className='grid gap-3'>
            <p className='text-sm font-medium'>Dev Tools</p>

            <div className='grid gap-1.5'>
              <label className='text-muted-foreground text-xs'>Subscription</label>
              <Select value={currentPlanId} onValueChange={handlePlanChange} disabled={isPending}>
                <SelectTrigger size='sm' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <label className='text-muted-foreground text-xs'>Language</label>
              <Select value={locale} onValueChange={handleLanguageChange}>
                <SelectTrigger size='sm' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANGUAGE_METADATA[lang].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <label className='text-muted-foreground text-xs'>Theme</label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger size='sm' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <label className='text-muted-foreground text-xs'>Timezone</label>
              <TimezoneSelect
                value={settings.timezone}
                onUpdate={(timezone) => timezoneMutation.mutate({ timezone })}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
