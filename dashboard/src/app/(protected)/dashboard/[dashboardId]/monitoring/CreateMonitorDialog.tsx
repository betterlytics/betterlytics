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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type CreateMonitorDialogProps = {
  dashboardId: string;
};

export function CreateMonitorDialog({ dashboardId }: CreateMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [intervalSeconds, setIntervalSeconds] = useState(30);
  const [timeoutMs, setTimeoutMs] = useState(3000);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('monitoringPage.form');

  const resetForm = () => {
    setName('');
    setUrl('');
    setIntervalSeconds(30);
    setTimeoutMs(3000);
    setIsEnabled(true);
  };

  const onSubmit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    startTransition(async () => {
      try {
        await createMonitorCheckAction(dashboardId, {
          name: name.trim() || undefined,
          url: url.trim(),
          intervalSeconds: Number(intervalSeconds),
          timeoutMs: Number(timeoutMs),
          isEnabled,
        });
        toast.success(t('success'));
        resetForm();
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(t('error'));
      }
    });
  };

  const intervalError = intervalSeconds < 5;
  const timeoutError = timeoutMs < 500;
  const urlError = !url;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default' className='w-full sm:w-auto'>
          {t('create')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='monitor-name'>{t('fields.name')}</Label>
            <Input
              id='monitor-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('placeholders.name')}
              disabled={isPending}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='monitor-url'>{t('fields.url')}</Label>
            <Input
              id='monitor-url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='https://example.com/health'
              className={cn(urlError && 'border-destructive')}
              disabled={isPending}
              required
              type='url'
            />
            {urlError && <p className='text-destructive text-xs'>{t('errors.url')}</p>}
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='monitor-interval'>{t('fields.interval')}</Label>
              <Input
                id='monitor-interval'
                type='number'
                min={5}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className={cn(intervalError && 'border-destructive')}
                disabled={isPending}
              />
              {intervalError && <p className='text-destructive text-xs'>{t('errors.interval')}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='monitor-timeout'>{t('fields.timeout')}</Label>
              <Input
                id='monitor-timeout'
                type='number'
                min={500}
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(Number(e.target.value))}
                className={cn(timeoutError && 'border-destructive')}
                disabled={isPending}
              />
              {timeoutError && <p className='text-destructive text-xs'>{t('errors.timeout')}</p>}
            </div>
          </div>

          <div className='flex items-center justify-between rounded-lg border p-3'>
            <div>
              <p className='text-sm font-medium'>{t('fields.enabled')}</p>
              <p className='text-muted-foreground text-xs'>{t('helper.enabled')}</p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} disabled={isPending} />
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={isPending}>
              {t('actions.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={isPending || intervalError || timeoutError || urlError}
              className='min-w-[120px]'
            >
              {isPending ? t('actions.creating') : t('actions.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
