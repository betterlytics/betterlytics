'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { type MonitorCheck, type HttpMethod, type RequestHeader } from '@/entities/analytics/monitoring.entities';
import { Check, Clock, Globe, Info, Plus, ShieldCheck, Timer, Trash2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type EditMonitorDialogProps = {
  dashboardId: string;
  monitor: MonitorCheck;
  trigger?: React.ReactNode;
};

export function EditMonitorDialog({ dashboardId, monitor, trigger }: EditMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [intervalIdx, setIntervalIdx] = useState(() =>
    nearestIndex(MONITOR_INTERVAL_MARKS, monitor.intervalSeconds),
  );
  const [timeoutIdx, setTimeoutIdx] = useState(() => nearestIndex(REQUEST_TIMEOUT_MARKS, monitor.timeoutMs));
  const [checkSslErrors, setCheckSslErrors] = useState(monitor.checkSslErrors);
  const [sslExpiryReminders, setSslExpiryReminders] = useState(monitor.sslExpiryReminders);
  const [httpMethod, setHttpMethod] = useState<HttpMethod>(monitor.httpMethod);
  const [requestHeaders, setRequestHeaders] = useState<RequestHeader[]>(monitor.requestHeaders ?? []);
  const [acceptedStatusCodes, setAcceptedStatusCodes] = useState<number[]>(monitor.acceptedStatusCodes ?? []);
  const [statusCodeInput, setStatusCodeInput] = useState('');

  useEffect(() => {
    if (!open) return;
    setIntervalIdx(nearestIndex(MONITOR_INTERVAL_MARKS, monitor.intervalSeconds));
    setTimeoutIdx(nearestIndex(REQUEST_TIMEOUT_MARKS, monitor.timeoutMs));
    setCheckSslErrors(monitor.checkSslErrors);
    setSslExpiryReminders(monitor.sslExpiryReminders);
    setHttpMethod(monitor.httpMethod);
    setRequestHeaders(monitor.requestHeaders ?? []);
    setAcceptedStatusCodes(monitor.acceptedStatusCodes ?? []);
    setStatusCodeInput('');
  }, [monitor, open]);

  const addHeader = () => {
    setRequestHeaders([...requestHeaders, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setRequestHeaders(requestHeaders.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setRequestHeaders(requestHeaders.map((header, i) => (i === index ? { ...header, [field]: value } : header)));
  };

  const addStatusCode = () => {
    const code = parseInt(statusCodeInput.trim(), 10);
    if (!isNaN(code) && code >= 100 && code <= 599 && !acceptedStatusCodes.includes(code)) {
      setAcceptedStatusCodes([...acceptedStatusCodes, code].sort((a, b) => a - b));
      setStatusCodeInput('');
    }
  };

  const removeStatusCode = (code: number) => {
    setAcceptedStatusCodes(acceptedStatusCodes.filter((c) => c !== code));
  };

  const toggleCommonStatusCode = (code: number) => {
    if (acceptedStatusCodes.includes(code)) {
      removeStatusCode(code);
    } else {
      setAcceptedStatusCodes([...acceptedStatusCodes, code].sort((a, b) => a - b));
    }
  };

  const intervalSeconds = MONITOR_INTERVAL_MARKS[intervalIdx];
  const timeoutMs = REQUEST_TIMEOUT_MARKS[timeoutIdx];

  const handleSave = () => {
    startTransition(async () => {
      try {
        // Filter out headers with empty keys
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
        });
        toast.success('Monitor updated');
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error('Unable to update monitor, please try again.');
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger ?? <Button size='sm'>Edit</Button>}</SheetTrigger>
      <SheetContent side='right' className='w-full max-w-2xl overflow-y-auto p-0 lg:max-w-3xl xl:max-w-4xl'>
        <div className='flex h-full flex-col'>
          <SheetHeader className='border-border space-y-1.5 border-b p-6'>
            <SheetTitle className='text-xl'>Edit monitor</SheetTitle>
            <SheetDescription className='text-muted-foreground text-sm'>
              Adjust the monitor cadence and timeout thresholds.
            </SheetDescription>
          </SheetHeader>

          <div className='flex-grow space-y-6 overflow-y-auto p-6'>
            <Card className='bg-card border-border'>
              <CardHeader className='flex flex-row items-start space-x-3'>
                <Info className='mt-1 h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400' />
                <div>
                  <CardTitle className='text-card-foreground text-base font-medium'>Configuration tips</CardTitle>
                  <CardDescription className='text-muted-foreground text-sm'>
                    Use shorter intervals for critical endpoints. Choose timeout values that match typical response
                    times to avoid false alarms.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle className='text-card-foreground flex items-center text-base font-medium'>
                  <Clock className='text-muted-foreground mr-2 h-4 w-4' />
                  Monitor interval
                </CardTitle>
                <CardDescription className='text-muted-foreground text-sm'>
                  Your monitor will be checked every{' '}
                  <span className='text-foreground font-medium'>{formatSeconds(intervalSeconds)}</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Slider
                  value={[intervalIdx]}
                  min={0}
                  max={MONITOR_INTERVAL_MARKS.length - 1}
                  step={1}
                  onValueChange={([val]) => setIntervalIdx(val)}
                  disabled={isPending}
                  className='[&>span:first-child]:bg-muted'
                />
                <IntervalMarkRow totalSteps={MONITOR_INTERVAL_MARKS.length - 1} activeIndex={intervalIdx} />
              </CardContent>
            </Card>

            <Separator />

            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle className='text-card-foreground flex items-center text-base font-medium'>
                  <Timer className='text-muted-foreground mr-2 h-4 w-4' />
                  Request timeout
                </CardTitle>
                <CardDescription className='text-muted-foreground text-sm'>
                  The request timeout is{' '}
                  <span className='text-foreground font-medium'>{formatSeconds(timeoutMs / 1000)}</span>. The
                  shorter the timeout, the earlier we mark the site as down.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Slider
                  value={[timeoutIdx]}
                  min={0}
                  max={REQUEST_TIMEOUT_MARKS.length - 1}
                  step={1}
                  onValueChange={([val]) => setTimeoutIdx(val)}
                  disabled={isPending}
                  className='[&>span:first-child]:bg-muted'
                />
                <TimeoutMarkRow totalSteps={REQUEST_TIMEOUT_MARKS.length - 1} activeIndex={timeoutIdx} />
              </CardContent>
            </Card>

            <Separator />

            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle className='text-card-foreground flex items-center text-base font-medium'>
                  <Globe className='text-muted-foreground mr-2 h-4 w-4' />
                  HTTP request settings
                </CardTitle>
                <CardDescription className='text-muted-foreground text-sm'>
                  Configure the HTTP method and custom headers for this monitor.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-5'>
                <div className='space-y-2'>
                  <Label htmlFor='http-method' className='text-sm font-medium'>
                    HTTP method
                  </Label>
                  <Select
                    value={httpMethod}
                    onValueChange={(val) => setHttpMethod(val as HttpMethod)}
                    disabled={isPending}
                  >
                    <SelectTrigger id='http-method' className='w-full sm:w-48'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='HEAD'>HEAD</SelectItem>
                      <SelectItem value='GET'>GET</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-muted-foreground text-xs'>
                    HEAD is more efficient but some servers don&apos;t support it. Use GET if HEAD doesn&apos;t
                    work.
                  </p>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-sm font-medium'>Request headers</Label>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={addHeader}
                      disabled={isPending}
                      className='h-8 cursor-pointer'
                    >
                      <Plus className='mr-1 h-3.5 w-3.5' />
                      Add header
                    </Button>
                  </div>
                  {requestHeaders.length === 0 ? (
                    <p className='text-muted-foreground text-xs'>
                      No custom headers configured. Add headers for authentication or custom requirements.
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {requestHeaders.map((header, index) => (
                        <div key={index} className='flex items-center gap-2'>
                          <Input
                            placeholder='Header name'
                            value={header.key}
                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                            disabled={isPending}
                            className='flex-1'
                          />
                          <Input
                            placeholder='Value'
                            value={header.value}
                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                            disabled={isPending}
                            className='flex-1'
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => removeHeader(index)}
                            disabled={isPending}
                            className='text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 flex-shrink-0 cursor-pointer'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle className='text-card-foreground flex items-center text-base font-medium'>
                  <Check className='text-muted-foreground mr-2 h-4 w-4' />
                  Accepted status codes
                </CardTitle>
                <CardDescription className='text-muted-foreground text-sm'>
                  By default, only 2xx status codes are considered healthy. Add additional status codes that should
                  not trigger an incident.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>Quick add common codes</Label>
                  <div className='flex flex-wrap gap-2'>
                    {COMMON_STATUS_CODES.map(({ code, label }) => {
                      const isSelected = acceptedStatusCodes.includes(code);
                      return (
                        <button
                          key={code}
                          type='button'
                          onClick={() => toggleCommonStatusCode(code)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                          } cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <span className='font-mono'>{code}</span>
                          <span className='text-muted-foreground'>{label}</span>
                          {isSelected && <Check className='h-3 w-3' />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Add custom status code</Label>
                  <div className='flex gap-2'>
                    <Input
                      type='number'
                      min={100}
                      max={599}
                      placeholder='e.g. 418'
                      value={statusCodeInput}
                      onChange={(e) => setStatusCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addStatusCode();
                        }
                      }}
                      disabled={isPending}
                      className='w-32 font-mono'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={addStatusCode}
                      disabled={isPending || !statusCodeInput.trim()}
                      className='h-9 cursor-pointer'
                    >
                      <Plus className='mr-1 h-3.5 w-3.5' />
                      Add
                    </Button>
                  </div>
                </div>

                {acceptedStatusCodes.length > 0 && (
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium'>
                      Additional accepted codes ({acceptedStatusCodes.length})
                    </Label>
                    <div className='flex flex-wrap gap-1.5'>
                      {acceptedStatusCodes.map((code) => (
                        <span
                          key={code}
                          className='bg-muted text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs'
                        >
                          {code}
                          <button
                            type='button'
                            onClick={() => removeStatusCode(code)}
                            disabled={isPending}
                            className='text-muted-foreground hover:text-foreground -mr-0.5 cursor-pointer rounded p-0.5 transition-colors disabled:cursor-not-allowed'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {acceptedStatusCodes.length === 0 && (
                  <p className='text-muted-foreground text-xs'>
                    No additional status codes configured. Only 2xx responses will be considered healthy.
                  </p>
                )}
              </CardContent>
            </Card>

            <Separator />

            <Card className='bg-card border-border'>
              <CardHeader>
                <CardTitle className='text-card-foreground flex items-center text-base font-medium'>
                  <ShieldCheck className='text-muted-foreground mr-2 h-4 w-4' />
                  SSL certificate checks
                </CardTitle>
                <CardDescription className='text-muted-foreground text-sm'>
                  Configure how SSL/TLS certificates are monitored for this endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-5'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='check-ssl-errors' className='text-sm font-medium'>
                      Check SSL errors
                    </Label>
                    <p className='text-muted-foreground text-xs'>
                      Alert when SSL certificate errors are detected (invalid, self-signed, expired).
                    </p>
                  </div>
                  <Switch
                    id='check-ssl-errors'
                    checked={checkSslErrors}
                    onCheckedChange={setCheckSslErrors}
                    disabled={isPending}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='ssl-expiry-reminders' className='text-sm font-medium'>
                      Enable SSL expiry reminders
                    </Label>
                    <p className='text-muted-foreground text-xs'>
                      Receive notifications before your SSL certificate expires.
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

const COMMON_STATUS_CODES = [
  { code: 301, label: 'Moved' },
  { code: 302, label: 'Found' },
  { code: 304, label: 'Not Modified' },
  { code: 401, label: 'Unauthorized' },
  { code: 403, label: 'Forbidden' },
  { code: 404, label: 'Not Found' },
  { code: 503, label: 'Unavailable' },
];

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
