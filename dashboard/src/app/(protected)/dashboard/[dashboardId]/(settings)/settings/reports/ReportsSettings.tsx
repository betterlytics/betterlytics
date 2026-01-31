'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Plus, X } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import SettingsSection from '../SettingsSection';
import SettingsPageHeader from '../SettingsPageHeader';
import { useSettings } from '@/contexts/SettingsProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { updateDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { DashboardSettingsUpdate, MAX_REPORT_RECIPIENTS } from '@/entities/dashboard/dashboardSettings.entities';
import { useTranslations, useLocale } from 'next-intl';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';

const emailSchema = z.string().email();

const getDayName = (isoDay: number, locale: string): string => {
  const date = new Date(2024, 0, isoDay);
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
};

type ReportType = 'weekly' | 'monthly';

interface RecipientInputProps {
  recipients: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
  isPending: boolean;
  disabled: boolean;
  reportType: ReportType;
}

function RecipientInput({ recipients, onAdd, onRemove, isPending, disabled, reportType }: RecipientInputProps) {
  const t = useTranslations('reportsSettings');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    try {
      emailSchema.parse(email);
      setEmailError('');
      return true;
    } catch {
      setEmailError(t('recipients.invalidEmail'));
      return false;
    }
  };

  const addEmail = () => {
    if (!newEmail.trim()) {
      setEmailError(t('recipients.emailRequired'));
      return;
    }

    if (!validateEmail(newEmail.trim())) {
      return;
    }

    const emailToAdd = newEmail.trim().toLowerCase();

    if (recipients.some((email) => email.toLowerCase() === emailToAdd)) {
      setEmailError(t('recipients.duplicateEmail'));
      return;
    }

    if (recipients.length >= MAX_REPORT_RECIPIENTS) {
      setEmailError(t('recipients.maxReached', { max: MAX_REPORT_RECIPIENTS }));
      return;
    }

    onAdd(emailToAdd);
    setNewEmail('');
    setEmailError('');
  };

  const handleEmailChange = (value: string) => {
    setNewEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  return (
    <div className='space-y-3'>
      <label className='text-muted-foreground text-sm'>
        {t(`recipients.${reportType}Label`, { count: recipients.length, max: MAX_REPORT_RECIPIENTS })}
      </label>

      {recipients.length > 0 && (
        <div className='divide-border divide-y rounded-md border'>
          {recipients.map((email) => (
            <div key={email} className='hover:bg-muted/30 flex items-center justify-between px-3 py-2'>
              <div className='flex items-center gap-2'>
                <Mail className='text-muted-foreground h-4 w-4' />
                <span className='text-sm'>{email}</span>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-destructive h-7 w-7 cursor-pointer'
                onClick={() => onRemove(email)}
                disabled={isPending || disabled}
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className='flex gap-2'>
        <div className='flex-1 space-y-1.5'>
          <Input
            type='email'
            placeholder={t('recipients.placeholder')}
            value={newEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addEmail();
              }
            }}
            className={emailError ? 'border-destructive' : ''}
            disabled={isPending || disabled || recipients.length >= MAX_REPORT_RECIPIENTS}
          />
          {emailError && <p className='text-destructive text-sm'>{emailError}</p>}
        </div>
        <Button
          onClick={addEmail}
          size='default'
          className='cursor-pointer'
          disabled={isPending || disabled || recipients.length >= MAX_REPORT_RECIPIENTS}
        >
          <Plus className='mr-1 h-4 w-4' />
          {t('recipients.addButton')}
        </Button>
      </div>
    </div>
  );
}

export default function ReportsSettings() {
  const t = useTranslations('reportsSettings');
  const locale = useLocale();
  const dashboardId = useDashboardId();
  const { settings, refreshSettings } = useSettings();
  const [isPending, startTransition] = useTransition();
  const { caps } = useCapabilities();

  const [weeklyReports, setWeeklyReports] = useState(settings.weeklyReports ?? false);
  const [weeklyReportDay, setWeeklyReportDay] = useState(settings.weeklyReportDay ?? 1);
  const [weeklyReportRecipients, setWeeklyReportRecipients] = useState<string[]>(
    settings.weeklyReportRecipients ?? [],
  );
  const [monthlyReports, setMonthlyReports] = useState(settings.monthlyReports ?? false);
  const [monthlyReportRecipients, setMonthlyReportRecipients] = useState<string[]>(
    settings.monthlyReportRecipients ?? [],
  );

  const saveSettings = (updates: DashboardSettingsUpdate) => {
    startTransition(async () => {
      try {
        await updateDashboardSettingsAction(dashboardId, updates);
        await refreshSettings();
        toast.success(t('toast.saved'));
      } catch {
        toast.error(t('toast.error'));
        setWeeklyReports(settings.weeklyReports ?? false);
        setWeeklyReportDay(settings.weeklyReportDay ?? 1);
        setWeeklyReportRecipients(settings.weeklyReportRecipients ?? []);
        setMonthlyReports(settings.monthlyReports ?? false);
        setMonthlyReportRecipients(settings.monthlyReportRecipients ?? []);
      }
    });
  };

  const handleWeeklyChange = (checked: boolean) => {
    setWeeklyReports(checked);
    saveSettings({ weeklyReports: checked });
  };

  const handleWeeklyDayChange = (value: string) => {
    const day = parseInt(value);
    setWeeklyReportDay(day);
    saveSettings({ weeklyReportDay: day });
  };

  const handleMonthlyChange = (checked: boolean) => {
    setMonthlyReports(checked);
    saveSettings({ monthlyReports: checked });
  };

  const addWeeklyRecipient = (email: string) => {
    const newRecipients = [...weeklyReportRecipients, email];
    setWeeklyReportRecipients(newRecipients);
    saveSettings({ weeklyReportRecipients: newRecipients });
  };

  const removeWeeklyRecipient = (emailToRemove: string) => {
    const newRecipients = weeklyReportRecipients.filter((email) => email !== emailToRemove);
    setWeeklyReportRecipients(newRecipients);
    saveSettings({ weeklyReportRecipients: newRecipients });
  };

  const addMonthlyRecipient = (email: string) => {
    const newRecipients = [...monthlyReportRecipients, email];
    setMonthlyReportRecipients(newRecipients);
    saveSettings({ monthlyReportRecipients: newRecipients });
  };

  const removeMonthlyRecipient = (emailToRemove: string) => {
    const newRecipients = monthlyReportRecipients.filter((email) => email !== emailToRemove);
    setMonthlyReportRecipients(newRecipients);
    saveSettings({ monthlyReportRecipients: newRecipients });
  };

  return (
    <div>
      <SettingsPageHeader title={t('title')} />

      <div className='space-y-6'>
        <SettingsSection
          title={t('weekly.title')}
          description={t('weekly.description')}
          pro={!caps.emailReports.emailReportsEnabled}
        >
          <CapabilityGate allowed={caps.emailReports.emailReportsEnabled}>
            {({ locked }) => (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='text-sm font-medium'>{t('weekly.toggle')}</span>
                  </div>
                  <PermissionGate permission='canManageSettings'>
                    {(disabled) => (
                      <Switch
                        checked={weeklyReports}
                        onCheckedChange={handleWeeklyChange}
                        disabled={isPending || disabled || locked}
                        className='cursor-pointer'
                      />
                    )}
                  </PermissionGate>
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <span className='text-sm font-medium'>{t('weekly.dayLabel')}</span>
                    <p className='text-muted-foreground text-xs'>{t('weekly.dayDescription')}</p>
                  </div>
                  <PermissionGate permission='canManageSettings'>
                    {(disabled) => (
                      <Select
                        value={weeklyReportDay.toString()}
                        onValueChange={handleWeeklyDayChange}
                        disabled={isPending || disabled || locked}
                      >
                        <SelectTrigger className='w-36 cursor-pointer'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <SelectItem key={day} value={day.toString()} className='cursor-pointer'>
                              {getDayName(day, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </PermissionGate>
                </div>

                <PermissionGate permission='canManageSettings'>
                  {(disabled) => (
                    <RecipientInput
                      recipients={weeklyReportRecipients}
                      onAdd={addWeeklyRecipient}
                      onRemove={removeWeeklyRecipient}
                      isPending={isPending}
                      disabled={disabled || locked}
                      reportType='weekly'
                    />
                  )}
                </PermissionGate>
              </div>
            )}
          </CapabilityGate>
        </SettingsSection>

        <SettingsSection
          title={t('monthly.title')}
          description={t('monthly.description')}
          pro={!caps.emailReports.emailReportsEnabled}
        >
          <CapabilityGate allowed={caps.emailReports.emailReportsEnabled}>
            {({ locked }) => (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='text-sm font-medium'>{t('monthly.toggle')}</span>
                  </div>
                  <PermissionGate permission='canManageSettings'>
                    {(disabled) => (
                      <Switch
                        checked={monthlyReports}
                        onCheckedChange={handleMonthlyChange}
                        disabled={isPending || disabled || locked}
                        className='cursor-pointer'
                      />
                    )}
                  </PermissionGate>
                </div>

                <PermissionGate permission='canManageSettings'>
                  {(disabled) => (
                    <RecipientInput
                      recipients={monthlyReportRecipients}
                      onAdd={addMonthlyRecipient}
                      onRemove={removeMonthlyRecipient}
                      isPending={isPending}
                      disabled={disabled || locked}
                      reportType='monthly'
                    />
                  )}
                </PermissionGate>
              </div>
            )}
          </CapabilityGate>
        </SettingsSection>
      </div>
    </div>
  );
}
