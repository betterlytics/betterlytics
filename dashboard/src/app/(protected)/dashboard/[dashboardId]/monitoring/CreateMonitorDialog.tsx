'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Clock, Loader2, CheckCircle2 } from 'lucide-react';
import {
  MONITOR_INTERVAL_MARKS,
  REQUEST_TIMEOUT_MARKS,
  INTERVAL_DISPLAY_MARKS,
  TIMEOUT_DISPLAY_MARKS,
  SENSITIVITY_DISPLAY_MARKS,
  RECOMMENDED_INTERVAL_SECONDS,
  RECOMMENDED_TIMEOUT_MS,
  RECOMMENDED_FAILURE_THRESHOLD,
  nearestIndex,
} from './[monitorId]/(EditMonitorSheet)/sliderConstants';
import { LabeledSlider } from './[monitorId]/(EditMonitorSheet)/LabeledSlider';
import { formatCompactDuration } from '@/utils/dateFormatters';
import { isUrlOnDomain } from '@/utils/domainValidation';

type CreateMonitorDialogProps = {
  dashboardId: string;
  domain: string;
};

export function CreateMonitorDialog({ dashboardId, domain }: CreateMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState(`https://${domain}`);
  const [intervalIdx, setIntervalIdx] = useState(
    nearestIndex(MONITOR_INTERVAL_MARKS, RECOMMENDED_INTERVAL_SECONDS),
  );
  const [timeoutIdx, setTimeoutIdx] = useState(nearestIndex(REQUEST_TIMEOUT_MARKS, RECOMMENDED_TIMEOUT_MS));
  const [failureThreshold, setFailureThreshold] = useState(RECOMMENDED_FAILURE_THRESHOLD);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('monitoringPage.form');

  const intervalSeconds = MONITOR_INTERVAL_MARKS[intervalIdx];
  const timeoutMs = REQUEST_TIMEOUT_MARKS[timeoutIdx];

  const resetForm = () => {
    setName('');
    setUrl(`https://${domain}`);
    setIntervalIdx(nearestIndex(MONITOR_INTERVAL_MARKS, RECOMMENDED_INTERVAL_SECONDS));
    setTimeoutIdx(nearestIndex(REQUEST_TIMEOUT_MARKS, RECOMMENDED_TIMEOUT_MS));
    setFailureThreshold(RECOMMENDED_FAILURE_THRESHOLD);
  };

  const onSubmit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    startTransition(async () => {
      try {
        await createMonitorCheckAction(dashboardId, {
          name: name.trim() || undefined,
          url: url.trim(),
          intervalSeconds,
          timeoutMs,
          isEnabled: true,
          failureThreshold,
        });
        toast.success(t('success'), {
          icon: <CheckCircle2 className='h-4 w-4 text-emerald-500' />,
          description: t('successDescription'),
        });
        resetForm();
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(t('error'));
      }
    });
  };

  const urlEmpty = !url.trim();
  const urlInvalid = !urlEmpty && !isUrlOnDomain(url, domain);
  const hasError = urlEmpty || urlInvalid;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default' className='w-full cursor-pointer sm:w-auto'>
          {t('create')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <div className='flex items-baseline gap-2'>
              <Label htmlFor='monitor-name'>{t('fields.name')}</Label>
              <span className='text-muted-foreground text-xs'>{t('helper.nameOptional')}</span>
            </div>
            <Input
              id='monitor-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('placeholders.name')}
              disabled={isPending}
            />
            <p className='text-muted-foreground text-xs'>{t('helper.nameDescription')}</p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='monitor-url'>{t('fields.url')}</Label>
            <Input
              id='monitor-url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={`https://${domain}/health`}
              className={cn(hasError && 'border-destructive')}
              disabled={isPending}
              required
              type='url'
            />
            {urlEmpty && <p className='text-destructive text-xs'>{t('errors.url')}</p>}
            {urlInvalid && <p className='text-destructive text-xs'>{t('errors.urlDomain', { domain })}</p>}
          </div>

          <Separator />

          <div className='bg-muted/30 rounded-lg border p-5'>
            <div className='mb-5 flex items-center gap-2'>
              <Clock className='text-muted-foreground h-4 w-4' />
              <h3 className='text-sm font-semibold tracking-tight'>{t('timing.title')}</h3>
            </div>

            <div className='space-y-5'>
              <LabeledSlider
                label={t('timing.interval.label')}
                badge={t('timing.interval.badge')}
                description={t('timing.interval.description', { value: formatCompactDuration(intervalSeconds) })}
                value={intervalIdx}
                min={0}
                max={MONITOR_INTERVAL_MARKS.length - 1}
                marks={INTERVAL_DISPLAY_MARKS}
                onValueChange={setIntervalIdx}
                formatValue={() => formatCompactDuration(intervalSeconds)}
                recommendedValue={nearestIndex(MONITOR_INTERVAL_MARKS, RECOMMENDED_INTERVAL_SECONDS)}
                disabled={isPending}
              />

              <Separator />

              <LabeledSlider
                label={t('timing.timeout.label')}
                description={t('timing.timeout.description')}
                value={timeoutIdx}
                min={0}
                max={REQUEST_TIMEOUT_MARKS.length - 1}
                marks={TIMEOUT_DISPLAY_MARKS}
                onValueChange={setTimeoutIdx}
                formatValue={() => formatCompactDuration(timeoutMs / 1000)}
                recommendedValue={nearestIndex(REQUEST_TIMEOUT_MARKS, RECOMMENDED_TIMEOUT_MS)}
                disabled={isPending}
              />

              <Separator />

              <LabeledSlider
                label={t('timing.sensitivity.label')}
                description={t('timing.sensitivity.description')}
                value={failureThreshold}
                min={1}
                max={10}
                marks={SENSITIVITY_DISPLAY_MARKS}
                onValueChange={setFailureThreshold}
                formatValue={(v) =>
                  v === 1 ? t('timing.sensitivity.valueOne') : t('timing.sensitivity.valueOther', { count: v })
                }
                recommendedValue={RECOMMENDED_FAILURE_THRESHOLD}
                disabled={isPending}
              />
            </div>
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              className='cursor-pointer'
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t('actions.cancel')}
            </Button>
            <Button type='submit' disabled={isPending || hasError} className='min-w-[140px] cursor-pointer'>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('actions.creating')}
                </>
              ) : (
                t('actions.create')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
