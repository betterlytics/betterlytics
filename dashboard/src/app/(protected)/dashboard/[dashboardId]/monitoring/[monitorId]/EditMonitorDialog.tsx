'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import {
  type MonitorCheck,
  type HttpMethod,
  type RequestHeader,
  type StatusCodeValue,
} from '@/entities/analytics/monitoring.entities';
import { Bell, ChevronRight, Info, Mail, Plus, Trash2, X } from 'lucide-react';
import { getStatusCodeColorClasses } from '@/utils/monitoringStyles';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

type EditMonitorDialogProps = {
  dashboardId: string;
  monitor: MonitorCheck;
  trigger?: React.ReactNode;
};

export function EditMonitorDialog({ dashboardId, monitor, trigger }: EditMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('monitoringEditDialog');

  const [intervalIdx, setIntervalIdx] = useState(() =>
    nearestIndex(MONITOR_INTERVAL_MARKS, monitor.intervalSeconds),
  );
  const [timeoutIdx, setTimeoutIdx] = useState(() => nearestIndex(REQUEST_TIMEOUT_MARKS, monitor.timeoutMs));
  const [checkSslErrors, setCheckSslErrors] = useState(monitor.checkSslErrors);
  const [sslExpiryReminders, setSslExpiryReminders] = useState(monitor.sslExpiryReminders);
  const [httpMethod, setHttpMethod] = useState<HttpMethod>(monitor.httpMethod);
  const [requestHeaders, setRequestHeaders] = useState<RequestHeader[]>(monitor.requestHeaders ?? []);
  const [acceptedStatusCodes, setAcceptedStatusCodes] = useState<StatusCodeValue[]>(
    monitor.acceptedStatusCodes?.length ? monitor.acceptedStatusCodes : ['2xx'],
  );
  const [statusCodeInput, setStatusCodeInput] = useState('');

  // Alert configuration state
  const [alertsEnabled, setAlertsEnabled] = useState(monitor.alertsEnabled);
  const [alertEmails, setAlertEmails] = useState<string[]>(monitor.alertEmails ?? []);
  const [alertEmailInput, setAlertEmailInput] = useState('');
  const [alertOnDown, setAlertOnDown] = useState(monitor.alertOnDown);
  const [alertOnRecovery, setAlertOnRecovery] = useState(monitor.alertOnRecovery);
  const [alertOnSslExpiry, setAlertOnSslExpiry] = useState(monitor.alertOnSslExpiry);
  const [sslExpiryAlertDays, setSslExpiryAlertDays] = useState(monitor.sslExpiryAlertDays);
  const [failureThreshold, setFailureThreshold] = useState(monitor.failureThreshold);

  useEffect(() => {
    if (!open) return;
    setIntervalIdx(nearestIndex(MONITOR_INTERVAL_MARKS, monitor.intervalSeconds));
    setTimeoutIdx(nearestIndex(REQUEST_TIMEOUT_MARKS, monitor.timeoutMs));
    setCheckSslErrors(monitor.checkSslErrors);
    setSslExpiryReminders(monitor.sslExpiryReminders);
    setHttpMethod(monitor.httpMethod);
    const existingHeaders = monitor.requestHeaders ?? [];
    const hasEmptyRow = existingHeaders.some((h) => h.key === '' && h.value === '');
    setRequestHeaders(hasEmptyRow ? existingHeaders : [...existingHeaders, { key: '', value: '' }]);
    setAcceptedStatusCodes(monitor.acceptedStatusCodes?.length ? monitor.acceptedStatusCodes : ['2xx']);
    setStatusCodeInput('');
    // Reset alert state
    setAlertsEnabled(monitor.alertsEnabled);
    setAlertEmails(monitor.alertEmails ?? []);
    setAlertEmailInput('');
    setAlertOnDown(monitor.alertOnDown);
    setAlertOnRecovery(monitor.alertOnRecovery);
    setAlertOnSslExpiry(monitor.alertOnSslExpiry);
    setSslExpiryAlertDays(monitor.sslExpiryAlertDays);
    setFailureThreshold(monitor.failureThreshold);
  }, [monitor, open]);

  const removeHeader = (index: number) => {
    const newHeaders = requestHeaders.filter((_, i) => i !== index);
    // Ensure there's always at least one empty row
    const hasEmptyRow = newHeaders.some((h) => h.key === '' && h.value === '');
    setRequestHeaders(hasEmptyRow ? newHeaders : [...newHeaders, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = requestHeaders.map((header, i) => (i === index ? { ...header, [field]: value } : header));
    // If editing the last row and it now has content, add a new empty row
    const isLastRow = index === requestHeaders.length - 1;
    const updatedRow = newHeaders[index];
    const rowHasContent = updatedRow.key !== '' || updatedRow.value !== '';
    if (isLastRow && rowHasContent) {
      newHeaders.push({ key: '', value: '' });
    }
    setRequestHeaders(newHeaders);
  };

  const removeStatusCode = (code: StatusCodeValue) => {
    setAcceptedStatusCodes(acceptedStatusCodes.filter((c) => c !== code));
  };

  const sortStatusCodes = (codes: StatusCodeValue[]): StatusCodeValue[] => {
    return [...codes].sort((a, b) => {
      // Sort ranges (like '2xx') before specific codes
      const aStr = String(a);
      const bStr = String(b);
      const aIsRange = aStr.includes('x');
      const bIsRange = bStr.includes('x');
      if (aIsRange && !bIsRange) return -1;
      if (!aIsRange && bIsRange) return 1;
      return aStr.localeCompare(bStr);
    });
  };

  const handleStatusCodeInputChange = (value: string) => {
    // Allow 'x' character for ranges like 2xx, 3xx
    const sanitized = value.replace(/[^0-9xX]/g, '').toLowerCase();
    setStatusCodeInput(sanitized);
  };

  const handleAddStatusCode = () => {
    const input = statusCodeInput.trim().toLowerCase();

    if (!input) return;

    // Check for range pattern like 2xx, 3xx, 4xx, 5xx
    if (/^[2-5]xx$/.test(input)) {
      if (acceptedStatusCodes.includes(input)) {
        toast.error(`${input} is already added`);
      } else {
        setAcceptedStatusCodes(sortStatusCodes([...acceptedStatusCodes, input]));
      }
      setStatusCodeInput('');
      return;
    }

    // Check for invalid range patterns (1xx, 6xx, etc.)
    if (/^[0-9]xx$/.test(input)) {
      toast.error('Only ranges 2xx-5xx are valid HTTP status codes');
      return;
    }

    // Otherwise treat as specific code
    const code = parseInt(input, 10);

    if (isNaN(code)) {
      toast.error('Please enter a valid status code (e.g., 200) or range (e.g., 2xx)');
      return;
    }

    if (code < 100 || code > 599) {
      toast.error('Status code must be between 100 and 599');
      return;
    }

    if (acceptedStatusCodes.includes(code)) {
      toast.error(`${code} is already added`);
      setStatusCodeInput('');
      return;
    }

    setAcceptedStatusCodes(sortStatusCodes([...acceptedStatusCodes, code]));
    setStatusCodeInput('');
  };

  // Alert email management
  const handleAddAlertEmail = () => {
    const email = alertEmailInput.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('alerts.invalidEmail'));
      return;
    }

    if (alertEmails.includes(email)) {
      toast.error(t('alerts.emailExists'));
      setAlertEmailInput('');
      return;
    }

    setAlertEmails([...alertEmails, email]);
    setAlertEmailInput('');
  };

  const removeAlertEmail = (email: string) => {
    setAlertEmails(alertEmails.filter((e) => e !== email));
  };

  const intervalSeconds = MONITOR_INTERVAL_MARKS[intervalIdx];
  const timeoutMs = REQUEST_TIMEOUT_MARKS[timeoutIdx];

  const handleSave = () => {
    startTransition(async () => {
      try {
        const validHeaders = requestHeaders.filter((h) => h.key.trim() !== '');
        await updateMonitorCheckAction(dashboardId, {
          id: monitor.id,
          name: monitor.name ?? null,
          url: monitor.url,
          intervalSeconds,
          timeoutMs,
          isEnabled: monitor.isEnabled,
          checkSslErrors,
          sslExpiryReminders,
          httpMethod,
          requestHeaders: validHeaders.length > 0 ? validHeaders : null,
          acceptedStatusCodes,
          // Alert configuration
          alertsEnabled,
          alertEmails,
          alertOnDown,
          alertOnRecovery,
          alertOnSslExpiry,
          sslExpiryAlertDays,
          failureThreshold,
        });
        toast.success(t('success'));
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(t('error'));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger ?? <Button size='sm'>Edit</Button>}</SheetTrigger>
      <SheetContent side='right' className='w-full max-w-2xl overflow-y-auto p-0 lg:max-w-3xl xl:max-w-4xl'>
        <div className='flex h-full flex-col'>
          <SheetHeader className='space-y-1.5 px-6 pt-6 pb-0'>
            <SheetTitle className='text-xl'>Edit monitor</SheetTitle>
          </SheetHeader>

          <div className='flex-grow space-y-6 overflow-y-auto p-6'>
            <Card className='bg-card gap-3 py-4'>
              <CardHeader className='gap-1 px-4 py-0'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-card-foreground text-sm font-medium'>Monitor interval</CardTitle>
                  <span className='inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'>
                    <Info className='h-3 w-3' />
                    Use shorter intervals for critical endpoints
                  </span>
                </div>
                <CardDescription className='text-muted-foreground text-xs'>
                  Your monitor will be checked every{' '}
                  <span className='text-foreground font-medium'>{formatSeconds(intervalSeconds)}</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 px-4 pt-2'>
                <Slider
                  value={[intervalIdx]}
                  min={0}
                  max={MONITOR_INTERVAL_MARKS.length - 1}
                  step={1}
                  onValueChange={([val]) => setIntervalIdx(val)}
                  disabled={isPending}
                  className='[&>span:first-child]:bg-muted [&_[role=slider]]:border-primary [&_[role=slider]]:bg-card [&_[role=slider]]:shadow-md'
                />
                <IntervalMarkRow totalSteps={MONITOR_INTERVAL_MARKS.length - 1} activeIndex={intervalIdx} />
              </CardContent>
            </Card>

            <Separator />

            <Card className='bg-card gap-3 py-4'>
              <CardHeader className='gap-1 px-4 py-0'>
                <CardTitle className='text-card-foreground text-sm font-medium'>Request timeout</CardTitle>
                <CardDescription className='text-muted-foreground text-xs'>
                  The request timeout is{' '}
                  <span className='text-foreground font-medium'>{formatSeconds(timeoutMs / 1000)}</span>. The
                  shorter the timeout, the earlier we mark the site as down.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 px-4 pt-2'>
                <Slider
                  value={[timeoutIdx]}
                  min={0}
                  max={REQUEST_TIMEOUT_MARKS.length - 1}
                  step={1}
                  onValueChange={([val]) => setTimeoutIdx(val)}
                  disabled={isPending}
                  className='[&>span:first-child]:bg-muted [&_[role=slider]]:border-primary [&_[role=slider]]:bg-card [&_[role=slider]]:shadow-md'
                />
                <TimeoutMarkRow totalSteps={REQUEST_TIMEOUT_MARKS.length - 1} activeIndex={timeoutIdx} />
              </CardContent>
            </Card>

            <Card className='bg-card gap-3 py-4'>
              <CardHeader className='gap-1 px-4 py-0'>
                <CardTitle className='text-card-foreground text-sm font-medium'>SSL certificate checks</CardTitle>
              </CardHeader>
              <CardContent className='space-y-5 px-4 pt-2'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='check-ssl-errors' className='text-sm font-medium'>
                      Check SSL errors
                    </Label>
                    <p className='text-muted-foreground text-xs'>
                      Create incidents when SSL certificate errors are detected
                    </p>
                  </div>
                  <Switch
                    id='check-ssl-errors'
                    checked={checkSslErrors}
                    onCheckedChange={setCheckSslErrors}
                    disabled={isPending}
                  />
                </div>
                <Separator />
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='ssl-expiry-reminders' className='text-sm font-medium'>
                      SSL expiry reminders
                    </Label>
                    <p className='text-muted-foreground text-xs'>
                      Get notified before your SSL certificate expires
                    </p>
                  </div>
                  <Switch
                    id='ssl-expiry-reminders'
                    checked={sslExpiryReminders}
                    onCheckedChange={setSslExpiryReminders}
                    disabled={isPending}
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Alerts Section */}
            <Card className='bg-card gap-3 py-4'>
              <CardHeader className='gap-1 px-4 py-0'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Bell className='h-4 w-4 text-amber-500' />
                    <CardTitle className='text-card-foreground text-sm font-medium'>{t('alerts.title')}</CardTitle>
                  </div>
                  <Switch
                    id='alerts-enabled'
                    checked={alertsEnabled}
                    onCheckedChange={setAlertsEnabled}
                    disabled={isPending}
                  />
                </div>
                <CardDescription className='text-muted-foreground text-xs'>
                  {t('alerts.description')}
                </CardDescription>
              </CardHeader>

              {alertsEnabled && (
                <CardContent className='space-y-5 px-4 pt-4'>
                  {/* Email Recipients */}
                  <div className='space-y-3'>
                    <div className='space-y-0.5'>
                      <Label className='text-sm font-medium'>{t('alerts.recipients')}</Label>
                      <p className='text-muted-foreground text-xs'>{t('alerts.recipientsDescription')}</p>
                    </div>
                    <div className='space-y-2'>
                      {alertEmails.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                          {alertEmails.map((email) => (
                            <Badge
                              key={email}
                              variant='secondary'
                              className='inline-flex items-center gap-1.5 py-1 pr-1.5 pl-2.5'
                            >
                              <Mail className='h-3 w-3' />
                              <span className='max-w-[200px] truncate text-xs'>{email}</span>
                              <button
                                type='button'
                                onClick={() => removeAlertEmail(email)}
                                disabled={isPending}
                                className='hover:bg-muted ml-0.5 cursor-pointer rounded p-0.5 transition-colors'
                              >
                                <X className='h-3 w-3' />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className='flex items-center gap-2'>
                        <Input
                          type='email'
                          placeholder={t('alerts.emailPlaceholder')}
                          value={alertEmailInput}
                          onChange={(e) => setAlertEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAlertEmail();
                            }
                          }}
                          disabled={isPending}
                          className='flex-1'
                        />
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleAddAlertEmail}
                          disabled={isPending || !alertEmailInput.trim()}
                          className='cursor-pointer'
                        >
                          <Plus className='mr-1 h-4 w-4' />
                          {t('alerts.addEmail')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Alert Triggers */}
                  <div className='space-y-4'>
                    <Label className='text-sm font-medium'>{t('alerts.triggers')}</Label>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='alert-on-down' className='text-sm font-medium'>
                          {t('alerts.onDown')}
                        </Label>
                        <p className='text-muted-foreground text-xs'>{t('alerts.onDownDescription')}</p>
                      </div>
                      <Switch
                        id='alert-on-down'
                        checked={alertOnDown}
                        onCheckedChange={setAlertOnDown}
                        disabled={isPending}
                      />
                    </div>

                    {alertOnDown && (
                      <div className='bg-muted/50 ml-4 space-y-2 rounded-md border p-3'>
                        <Label htmlFor='failure-threshold' className='text-xs font-medium'>
                          {t('alerts.failureThreshold')}
                        </Label>
                        <p className='text-muted-foreground text-xs'>{t('alerts.failureThresholdDescription')}</p>
                        <div className='flex items-center gap-3'>
                          <Slider
                            id='failure-threshold'
                            value={[failureThreshold]}
                            min={1}
                            max={10}
                            step={1}
                            onValueChange={([val]) => setFailureThreshold(val)}
                            disabled={isPending}
                            className='[&>span:first-child]:bg-muted [&_[role=slider]]:border-primary [&_[role=slider]]:bg-card flex-1 [&_[role=slider]]:shadow-md'
                          />
                          <span className='text-muted-foreground w-16 text-right text-sm font-medium'>
                            {t('alerts.failureCount', { count: failureThreshold })}
                          </span>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='alert-on-recovery' className='text-sm font-medium'>
                          {t('alerts.onRecovery')}
                        </Label>
                        <p className='text-muted-foreground text-xs'>{t('alerts.onRecoveryDescription')}</p>
                      </div>
                      <Switch
                        id='alert-on-recovery'
                        checked={alertOnRecovery}
                        onCheckedChange={setAlertOnRecovery}
                        disabled={isPending}
                      />
                    </div>

                    <Separator />

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='alert-on-ssl-expiry' className='text-sm font-medium'>
                          {t('alerts.onSslExpiry')}
                        </Label>
                        <p className='text-muted-foreground text-xs'>{t('alerts.onSslExpiryDescription')}</p>
                      </div>
                      <Switch
                        id='alert-on-ssl-expiry'
                        checked={alertOnSslExpiry}
                        onCheckedChange={setAlertOnSslExpiry}
                        disabled={isPending}
                      />
                    </div>

                    {alertOnSslExpiry && (
                      <div className='bg-muted/50 ml-4 space-y-2 rounded-md border p-3'>
                        <Label htmlFor='ssl-expiry-days' className='text-xs font-medium'>
                          {t('alerts.sslExpiryDays')}
                        </Label>
                        <p className='text-muted-foreground text-xs'>{t('alerts.sslExpiryDaysDescription')}</p>
                        <div className='flex items-center gap-3'>
                          <Slider
                            id='ssl-expiry-days'
                            value={[sslExpiryAlertDays]}
                            min={1}
                            max={90}
                            step={1}
                            onValueChange={([val]) => setSslExpiryAlertDays(val)}
                            disabled={isPending}
                            className='[&>span:first-child]:bg-muted [&_[role=slider]]:border-primary [&_[role=slider]]:bg-card flex-1 [&_[role=slider]]:shadow-md'
                          />
                          <span className='text-muted-foreground w-20 text-right text-sm font-medium'>
                            {t('alerts.daysCount', { count: sslExpiryAlertDays })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            <Collapsible defaultOpen={false} className='group/advanced'>
              <Card className='bg-card gap-3 py-2'>
                <CollapsibleTrigger className='hover:bg-muted/30 flex w-full cursor-pointer items-center gap-2 px-4 py-3 transition-colors'>
                  <ChevronRight className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]/advanced:rotate-90' />
                  <span className='text-sm font-medium'>Advanced settings</span>
                </CollapsibleTrigger>
                <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden'>
                  <CardContent className='space-y-6 pb-2'>
                    <div className='space-y-3'>
                      <div className='space-y-0.5'>
                        <Label className='text-sm font-medium'>HTTP method</Label>
                        <p className='text-muted-foreground text-xs'>
                          HEAD is faster but some servers may not support it
                        </p>
                      </div>
                      <div className='bg-muted inline-flex rounded-lg p-1'>
                        {(['HEAD', 'GET'] as const).map((method) => (
                          <button
                            key={method}
                            type='button'
                            onClick={() => setHttpMethod(method)}
                            disabled={isPending}
                            className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all disabled:cursor-not-allowed ${
                              httpMethod === method
                                ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className='space-y-3'>
                      <div className='space-y-0.5'>
                        <Label className='text-sm font-medium'>Request headers</Label>
                        <p className='text-muted-foreground text-xs'>
                          Custom headers to include with each request
                        </p>
                      </div>
                      <div className='space-y-2'>
                        {requestHeaders.map((header, index) => {
                          const isEmptyRow = header.key === '' && header.value === '';
                          const isLastRow = index === requestHeaders.length - 1;
                          const showDeleteButton = !isEmptyRow || !isLastRow;

                          return (
                            <div key={index} className='flex items-center gap-2'>
                              <div className='border-input flex flex-1 overflow-hidden rounded-md border'>
                                <Input
                                  placeholder='X-Header-Name'
                                  value={header.key}
                                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                  disabled={isPending}
                                  className='flex-1 rounded-none border-0 focus-visible:z-10 focus-visible:ring-1'
                                />
                                <div className='bg-border w-px' />
                                <Input
                                  placeholder='Value'
                                  value={header.value}
                                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                  disabled={isPending}
                                  className='flex-1 rounded-none border-0 focus-visible:ring-1'
                                />
                              </div>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                onClick={() => removeHeader(index)}
                                disabled={isPending || !showDeleteButton}
                                className={`h-9 w-9 flex-shrink-0 cursor-pointer ${
                                  showDeleteButton
                                    ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
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

                    <div className='space-y-3'>
                      <div className='space-y-0.5'>
                        <Label className='text-sm font-medium'>Accepted status codes</Label>
                        <p className='text-muted-foreground text-xs'>
                          Status codes that indicate the site is up. Other codes will trigger incidents.
                        </p>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        {acceptedStatusCodes.map((code) => (
                          <span
                            key={code}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-medium ${getStatusCodeColorClasses(code)}`}
                          >
                            {code}
                            <button
                              type='button'
                              onClick={() => removeStatusCode(code)}
                              disabled={isPending}
                              className='-mr-0.5 cursor-pointer rounded p-0.5 transition-opacity hover:opacity-70 disabled:cursor-not-allowed'
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </span>
                        ))}
                        <div className='flex items-center gap-1.5'>
                          <Input
                            type='text'
                            placeholder='2xx or 200'
                            value={statusCodeInput}
                            onChange={(e) => handleStatusCodeInputChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddStatusCode();
                              }
                            }}
                            disabled={isPending}
                            className='h-8 w-24 font-mono text-xs'
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={handleAddStatusCode}
                            disabled={isPending || !statusCodeInput.trim()}
                            className='h-8 w-8 cursor-pointer'
                          >
                            <Plus className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          <div className='border-border bg-background sticky mt-auto flex justify-end gap-2 border-t p-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isPending}
              className='cursor-pointer'
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleSave}
              disabled={isPending}
              className='min-w-[120px] cursor-pointer'
            >
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// 30s through 59s (1-second ticks), then 1m through 59m (1-minute ticks), then 1h through 24h (1-hour ticks)
const MONITOR_INTERVAL_MARKS = [
  // 1-second ticks: 30s to 59s (30 values, indices 0-29)
  ...Array.from({ length: 30 }, (_, i) => 30 + i),
  // 1-minute ticks: 1m to 59m (59 values, indices 30-88)
  ...Array.from({ length: 59 }, (_, i) => (i + 1) * 60),
  // 1-hour ticks: 1h to 24h (24 values, indices 89-112)
  ...Array.from({ length: 24 }, (_, i) => (i + 1) * 3600),
];
// 1s through 30s in 1s increments
const REQUEST_TIMEOUT_MARKS = Array.from({ length: 30 }, (_, i) => (i + 1) * 1000);

function nearestIndex(values: number[], target: number) {
  let bestIdx = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  values.forEach((value, idx) => {
    const diff = Math.abs(value - target);
    if (diff < bestDiff) {
      bestIdx = idx;
      bestDiff = diff;
    }
  });
  return bestIdx;
}

function formatSeconds(value: number) {
  if (value < 60) return `${value}s`;
  const minutes = value / 60;
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours}h`;
  const days = hours / 24;
  return `${days}d`;
}

function IntervalMarkRow({ totalSteps, activeIndex }: { totalSteps: number; activeIndex: number }) {
  // Display labels at their actual slider positions
  // Seconds: 30s(0), 31s(1), ..., 59s(29)
  // Minutes: 1m(30), 2m(31), ..., 59m(88)
  // Hours: 1h(89), 2h(90), ..., 24h(112)
  // Show: 30s, 1m, 15m, 30m, 1h, 6h, 12h, 24h
  const displayMarks = [
    { idx: 0, label: '30s' }, // 30s
    { idx: 30, label: '1m' }, // 1m (first minute tick)
    { idx: 44, label: '15m' }, // 15m = idx 30 + (15-1) = 44
    { idx: 59, label: '30m' }, // 30m = idx 30 + (30-1) = 59
    { idx: 89, label: '1h' }, // 1h (first hour tick)
    { idx: 94, label: '6h' }, // 6h = idx 89 + (6-1) = 94
    { idx: 100, label: '12h' }, // 12h = idx 89 + (12-1) = 100
    { idx: 112, label: '24h' }, // 24h = idx 89 + (24-1) = 112
  ];

  return (
    <div className='relative h-5'>
      {displayMarks.map(({ idx, label }, i) => {
        // Calculate position as percentage based on actual slider index
        const position = (idx / totalSteps) * 100;
        // Adjust first and last label positions to prevent overflow
        const isFirst = i === 0;
        const isLast = i === displayMarks.length - 1;

        return (
          <span
            key={idx}
            className={`text-muted-foreground absolute text-xs ${idx === activeIndex ? 'text-foreground font-semibold' : ''} ${isFirst ? '' : isLast ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: `${position}%` }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function TimeoutMarkRow({ totalSteps, activeIndex }: { totalSteps: number; activeIndex: number }) {
  const displayMarks = [
    { idx: 0, label: '1s' },
    { idx: 4, label: '5s' },
    { idx: 9, label: '10s' },
    { idx: 14, label: '15s' },
    { idx: 19, label: '20s' },
    { idx: 24, label: '25s' },
    { idx: 29, label: '30s' },
  ];

  return (
    <div className='relative h-5'>
      {displayMarks.map(({ idx, label }, i) => {
        // Calculate position as percentage based on actual slider index
        const position = (idx / totalSteps) * 100;
        // Adjust first and last label positions to prevent overflow
        const isFirst = i === 0;
        const isLast = i === displayMarks.length - 1;

        return (
          <span
            key={idx}
            className={`text-muted-foreground absolute text-xs ${idx === activeIndex ? 'text-foreground font-semibold' : ''} ${isFirst ? '' : isLast ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: `${position}%` }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
