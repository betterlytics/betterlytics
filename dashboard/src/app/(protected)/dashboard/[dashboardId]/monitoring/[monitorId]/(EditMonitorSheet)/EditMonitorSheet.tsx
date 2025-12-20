import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { updateMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { type MonitorCheck } from '@/entities/analytics/monitoring.entities';
import { Bell, ChevronDown, Clock, Plus, Settings, Trash2, X } from 'lucide-react';
import { getStatusCodeColorClasses } from './httpStatusColors';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { SettingToggle } from './SettingToggle';
import { EmailTokenInput } from '../../../../../../../components/inputs/EmailTokenInput';
import { useMonitorForm } from './useMonitorForm';
import { LabeledSlider } from './LabeledSlider';
import {
  MONITOR_INTERVAL_MARKS,
  REQUEST_TIMEOUT_MARKS,
  INTERVAL_DISPLAY_MARKS,
  TIMEOUT_DISPLAY_MARKS,
  SENSITIVITY_DISPLAY_MARKS,
  SSL_EXPIRY_DISPLAY_MARKS,
  RECOMMENDED_INTERVAL_SECONDS,
  RECOMMENDED_TIMEOUT_MS,
  RECOMMENDED_FAILURE_THRESHOLD,
  RECOMMENDED_SSL_EXPIRY_DAYS,
  nearestIndex,
} from './sliderConstants';
import { formatCompactDuration } from '@/utils/dateFormatters';

type EditMonitorDialogProps = {
  dashboardId: string;
  monitor: MonitorCheck;
  trigger?: React.ReactNode;
};

export function EditMonitorDialog({ dashboardId, monitor, trigger }: EditMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('monitoringEditDialog');
  const tTiming = useTranslations('monitoringPage.form.timing');
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const form = useMonitorForm(monitor, open);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && form.isDirty) {
        setShowConfirmDialog(true);
      } else {
        setOpen(newOpen);
      }
    },
    [form.isDirty],
  );

  const handleConfirmDiscard = () => {
    setShowConfirmDialog(false);
    setOpen(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const data = form.getFormData();
        await updateMonitorCheckAction(dashboardId, {
          id: monitor.id,
          name: monitor.name ?? null,
          url: monitor.url,
          intervalSeconds: data.intervalSeconds,
          timeoutMs: data.timeoutMs,
          isEnabled: monitor.isEnabled,
          checkSslErrors: data.checkSslErrors,
          sslExpiryReminders: data.sslExpiryReminders,
          httpMethod: data.httpMethod,
          requestHeaders: data.requestHeaders.length > 0 ? data.requestHeaders : null,
          acceptedStatusCodes: data.acceptedStatusCodes,
          alertsEnabled: data.alertsEnabled,
          alertEmails: data.alertEmails,
          alertOnDown: data.alertOnDown,
          alertOnRecovery: data.alertOnRecovery,
          alertOnSslExpiry: data.alertOnSslExpiry,
          sslExpiryAlertDays: data.sslExpiryAlertDays,
          failureThreshold: data.failureThreshold,
        });
        toast.success(t('success'));
        form.resetToCurrentState();
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(t('error'));
      }
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{trigger ?? <Button size='sm'>{t('trigger')}</Button>}</SheetTrigger>
        <SheetContent side='right' className='w-full max-w-2xl overflow-y-auto p-0 sm:max-w-4xl'>
          <div className='flex h-full flex-col'>
            {/* Header */}
            <SheetHeader className='border-border space-y-1 border-b px-6 py-5'>
              <SheetTitle className='text-lg font-semibold'>{t('sheet.title')}</SheetTitle>
              <SheetDescription className='text-muted-foreground text-sm'>
                {t('sheet.description', { url: '' })}{' '}
                <span className='text-foreground font-medium'>{monitor.url}</span>
              </SheetDescription>
            </SheetHeader>

            {/* Content */}
            <div className='flex-grow space-y-8 overflow-y-auto px-6 py-6'>
              {/* Timing Section */}
              <section className='space-y-6'>
                <SectionHeader icon={Clock} title={t('sections.timing')} />

                <LabeledSlider
                  label={tTiming('interval.label')}
                  badge={tTiming('interval.badge')}
                  description={tTiming('interval.description', {
                    value: formatCompactDuration(form.intervalSeconds),
                  })}
                  value={form.state.intervalIdx}
                  min={0}
                  max={MONITOR_INTERVAL_MARKS.length - 1}
                  marks={INTERVAL_DISPLAY_MARKS}
                  onValueChange={form.setIntervalIdx}
                  formatValue={() => formatCompactDuration(form.intervalSeconds)}
                  recommendedValue={nearestIndex(MONITOR_INTERVAL_MARKS, RECOMMENDED_INTERVAL_SECONDS)}
                  disabled={isPending}
                />

                <Separator className='my-4' />

                <LabeledSlider
                  label={tTiming('timeout.label')}
                  description={tTiming('timeout.description')}
                  value={form.state.timeoutIdx}
                  min={0}
                  max={REQUEST_TIMEOUT_MARKS.length - 1}
                  marks={TIMEOUT_DISPLAY_MARKS}
                  onValueChange={form.setTimeoutIdx}
                  formatValue={() => formatCompactDuration(form.timeoutMs / 1000)}
                  recommendedValue={nearestIndex(REQUEST_TIMEOUT_MARKS, RECOMMENDED_TIMEOUT_MS)}
                  disabled={isPending}
                />

                <Separator className='my-4' />

                <LabeledSlider
                  label={tTiming('sensitivity.label')}
                  description={tTiming('sensitivity.description')}
                  value={form.state.alerts.failureThreshold}
                  min={1}
                  max={10}
                  marks={SENSITIVITY_DISPLAY_MARKS}
                  onValueChange={(val) => form.updateAlert('failureThreshold', val)}
                  formatValue={(v) =>
                    v === 1 ? tTiming('sensitivity.valueOne') : tTiming('sensitivity.valueOther', { count: v })
                  }
                  recommendedValue={RECOMMENDED_FAILURE_THRESHOLD}
                  disabled={isPending}
                />
              </section>

              <Separator />

              {/* Alerts Section */}
              <AlertsSection form={form} isPending={isPending} t={t} userEmail={userEmail} />

              <Separator />

              {/* Advanced Settings */}
              <AdvancedSettingsSection form={form} isPending={isPending} t={t} />
            </div>

            <div className='border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 flex items-center justify-between gap-3 border-t px-6 py-4 backdrop-blur'>
              <div className='flex items-center gap-2'>
                {form.isDirty && (
                  <>
                    <div className='h-2 w-2 animate-pulse rounded-full bg-amber-500' />
                    <span className='text-muted-foreground text-xs'>{t('unsavedChanges')}</span>
                  </>
                )}
              </div>
              <div className='flex gap-3'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                  className='cursor-pointer'
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  type='button'
                  onClick={handleSave}
                  disabled={isPending || !form.isDirty}
                  className='min-w-[100px] cursor-pointer'
                >
                  {isPending ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDiscard.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDiscard.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirmDiscard.keep')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>{t('confirmDiscard.discard')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper Components

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className='flex items-center gap-2'>
      <Icon className='text-muted-foreground h-4 w-4' />
      <h3 className='text-sm font-semibold tracking-tight'>{title}</h3>
    </div>
  );
}

type FormType = ReturnType<typeof useMonitorForm>;

function AlertsSection({
  form,
  isPending,
  t,
  userEmail,
}: {
  form: FormType;
  isPending: boolean;
  t: ReturnType<typeof useTranslations<'monitoringEditDialog'>>;
  userEmail?: string | null;
}) {
  const { alerts } = form.state;

  return (
    <section className='space-y-5'>
      <div className='flex items-center justify-between'>
        <SectionHeader icon={Bell} title={t('alerts.title')} />
        <SettingToggle
          id='alerts-enabled'
          label=''
          checked={alerts.enabled}
          onCheckedChange={(v) => form.updateAlert('enabled', v)}
          disabled={isPending}
        />
      </div>

      {alerts.enabled && (
        <div className='space-y-5'>
          {/* Email Recipients */}
          <div className='space-y-3'>
            <div>
              <Label className='text-sm font-medium'>{t('alerts.recipients')}</Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>{t('alerts.recipientsDescription')}</p>
            </div>

            <EmailTokenInput
              emails={alerts.emails}
              onAddEmail={form.tryAddAlertEmail}
              onRemoveEmail={form.removeAlertEmail}
              disabled={isPending}
              placeholder={t('alerts.emailPlaceholder')}
              suggestedEmail={userEmail ?? undefined}
            />
          </div>

          {/* Alert Triggers */}
          <div className='space-y-4'>
            <SettingToggle
              id='alert-on-down'
              label={t('alerts.onDown')}
              checked={alerts.onDown}
              onCheckedChange={(v) => form.updateAlert('onDown', v)}
              disabled={isPending}
            />

            <SettingToggle
              id='alert-on-recovery'
              label={t('alerts.onRecovery')}
              checked={alerts.onRecovery}
              onCheckedChange={(v) => form.updateAlert('onRecovery', v)}
              disabled={isPending}
            />

            <SettingToggle
              id='alert-on-ssl-expiry'
              label={t('alerts.onSslExpiry')}
              checked={alerts.onSslExpiry}
              onCheckedChange={(v) => form.updateAlert('onSslExpiry', v)}
              disabled={isPending}
            />

            {alerts.onSslExpiry && (
              <div className='pt-2'>
                <LabeledSlider
                  label={t('alerts.sslExpiryDays')}
                  description={t('alerts.sslExpiryDaysDescription')}
                  value={alerts.sslExpiryDays}
                  min={1}
                  max={90}
                  marks={SSL_EXPIRY_DISPLAY_MARKS}
                  onValueChange={(val) => form.updateAlert('sslExpiryDays', val)}
                  formatValue={(v) => t('alerts.daysCount', { count: v })}
                  recommendedValue={RECOMMENDED_SSL_EXPIRY_DAYS}
                  disabled={isPending}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AdvancedSettingsSection({
  form,
  isPending,
  t,
}: {
  form: FormType;
  isPending: boolean;
  t: ReturnType<typeof useTranslations<'monitoringEditDialog'>>;
}) {
  return (
    <Collapsible defaultOpen={false} className='group/advanced'>
      <CollapsibleTrigger className='hover:bg-muted/50 -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors'>
        <div className='flex items-center gap-2'>
          <Settings className='text-muted-foreground h-4 w-4' />
          <span className='text-sm font-semibold tracking-tight'>{t('sections.advanced')}</span>
        </div>
        <ChevronDown className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]/advanced:rotate-180' />
      </CollapsibleTrigger>

      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden'>
        <div className='space-y-6 pt-4'>
          {/* HTTP Method */}
          <div className='space-y-3'>
            <div>
              <Label className='text-sm font-medium'>{t('advanced.httpMethod.label')}</Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>{t('advanced.httpMethod.description')}</p>
            </div>
            <Tabs value={form.state.httpMethod} onValueChange={(v) => form.setHttpMethod(v as 'HEAD' | 'GET')}>
              <TabsList className='h-8'>
                {(['HEAD', 'GET'] as const).map((method) => (
                  <TabsTrigger
                    key={method}
                    value={method}
                    disabled={isPending}
                    className='px-3 py-1 text-xs font-medium'
                  >
                    {method}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          {/* SSL Monitoring */}
          <SettingToggle
            id='check-ssl-errors'
            label={t('advanced.sslMonitoring.label')}
            description={t('advanced.sslMonitoring.description')}
            checked={form.state.checkSslErrors}
            onCheckedChange={form.setCheckSslErrors}
            disabled={isPending}
          />

          <Separator />

          {/* Request Headers */}
          <div className='space-y-3'>
            <div>
              <Label className='text-sm font-medium'>{t('advanced.requestHeaders.label')}</Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>{t('advanced.requestHeaders.description')}</p>
            </div>
            <div className='space-y-2'>
              {form.state.requestHeaders.map((header, index) => {
                const isEmptyRow = header.key === '' && header.value === '';
                const isLastRow = index === form.state.requestHeaders.length - 1;
                const showDeleteButton = !isEmptyRow || !isLastRow;

                return (
                  <div key={index} className='flex items-center gap-2'>
                    <div className='border-input flex flex-1 overflow-hidden rounded-md border'>
                      <Input
                        placeholder={t('advanced.requestHeaders.namePlaceholder')}
                        value={header.key}
                        onChange={(e) => form.updateRequestHeader(index, 'key', e.target.value)}
                        disabled={isPending}
                        className='h-9 flex-1 rounded-none border-0 text-sm focus-visible:z-10 focus-visible:ring-1'
                      />
                      <div className='bg-border w-px' />
                      <Input
                        placeholder={t('advanced.requestHeaders.valuePlaceholder')}
                        value={header.value}
                        onChange={(e) => form.updateRequestHeader(index, 'value', e.target.value)}
                        disabled={isPending}
                        className='h-9 flex-1 rounded-none border-0 text-sm focus-visible:ring-1'
                      />
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => form.removeRequestHeader(index)}
                      disabled={isPending || !showDeleteButton}
                      className={`h-9 w-9 flex-shrink-0 cursor-pointer ${
                        showDeleteButton
                          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                          : 'invisible'
                      }`}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Accepted Status Codes */}
          <div className='space-y-3'>
            <div>
              <Label className='text-sm font-medium'>{t('advanced.acceptedStatusCodes.label')}</Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {t('advanced.acceptedStatusCodes.description')}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-1.5'>
              {form.state.acceptedStatusCodes.map((code) => (
                <span
                  key={code}
                  className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-xs font-medium ${getStatusCodeColorClasses(code)}`}
                >
                  {code}
                  <button
                    type='button'
                    onClick={() => form.removeStatusCode(code)}
                    disabled={isPending}
                    className='cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 disabled:cursor-not-allowed'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </span>
              ))}
              <div className='flex items-center gap-1'>
                <Input
                  type='text'
                  placeholder='2xx'
                  value={form.state.statusCodeInput}
                  onChange={(e) => form.handleStatusCodeInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      form.addStatusCode();
                    }
                  }}
                  disabled={isPending}
                  className='h-7 w-16 font-mono text-xs'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={form.addStatusCode}
                  disabled={isPending || !form.state.statusCodeInput.trim()}
                  className='h-7 w-7 cursor-pointer'
                >
                  <Plus className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
