'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { type MonitorCheck } from '@/entities/analytics/monitoring.entities';

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

  useEffect(() => {
    if (!open) return;
    setIntervalIdx(nearestIndex(MONITOR_INTERVAL_MARKS, monitor.intervalSeconds));
    setTimeoutIdx(nearestIndex(REQUEST_TIMEOUT_MARKS, monitor.timeoutMs));
  }, [monitor, open]);

  const intervalSeconds = MONITOR_INTERVAL_MARKS[intervalIdx];
  const timeoutMs = REQUEST_TIMEOUT_MARKS[timeoutIdx];

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateMonitorCheckAction(dashboardId, {
          id: monitor.id,
          name: monitor.name ?? null,
          url: monitor.url,
          intervalSeconds,
          timeoutMs,
          isEnabled: monitor.isEnabled,
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
      <SheetContent
        side='right'
        className='w-[95vw] max-w-4xl p-0 sm:w-[85vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl'
      >
        <SheetHeader className='border-b px-6 pt-6 pb-4'>
          <SheetTitle className='text-xl font-semibold'>Edit monitor</SheetTitle>
          <SheetDescription className='text-muted-foreground text-sm'>
            Adjust the monitor cadence and timeout thresholds.
          </SheetDescription>
        </SheetHeader>

        <div className='flex h-full flex-col'>
          <div className='flex h-full flex-col gap-6 overflow-y-auto px-6 py-6'>
            <Section
              title='Monitor interval'
              description={`Your monitor will be checked every ${formatSeconds(intervalSeconds)}.`}
              helper='Use shorter intervals for critical endpoints; longer for low-sensitivity checks.'
            >
              <Slider
                value={[intervalIdx]}
                min={0}
                max={MONITOR_INTERVAL_MARKS.length - 1}
                step={1}
                onValueChange={([val]) => setIntervalIdx(val)}
                disabled={isPending}
              />
              <MarkRow marks={MONITOR_INTERVAL_MARKS} format={(v) => formatSeconds(v)} activeIndex={intervalIdx} />
            </Section>

            <Section
              title='Request timeout'
              description={`The request timeout is ${formatSeconds(timeoutMs / 1000)}. The shorter the timeout, the earlier we mark the site as down.`}
              helper='Choose a value that matches typical response times; too short can cause false alarms.'
            >
              <Slider
                value={[timeoutIdx]}
                min={0}
                max={REQUEST_TIMEOUT_MARKS.length - 1}
                step={1}
                onValueChange={([val]) => setTimeoutIdx(val)}
                disabled={isPending}
              />
              <MarkRow
                marks={REQUEST_TIMEOUT_MARKS}
                format={(v) => formatSeconds(v / 1000)}
                activeIndex={timeoutIdx}
              />
            </Section>

            <div className='flex justify-end gap-2 border-t pt-4'>
              <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type='button' onClick={handleSave} disabled={isPending} className='min-w-[120px]'>
                {isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const MONITOR_INTERVAL_MARKS = [30, 60, 300, 1800, 3600, 43200, 86400];
const REQUEST_TIMEOUT_MARKS = [1000, 15000, 30000, 45000, 60000];

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

function Section({
  title,
  description,
  helper,
  children,
}: {
  title: string;
  description: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <section className='bg-card/50 rounded-lg border p-4 shadow-sm'>
      <div className='space-y-1'>
        <p className='text-sm font-semibold'>{title}</p>
        <p className='text-muted-foreground text-sm'>{description}</p>
        {helper ? <p className='text-muted-foreground text-xs'>{helper}</p> : null}
      </div>
      <div className='mt-4 space-y-2'>{children}</div>
    </section>
  );
}

function MarkRow({
  marks,
  format,
  activeIndex,
}: {
  marks: number[];
  format: (value: number) => string;
  activeIndex: number;
}) {
  return (
    <div className='text-muted-foreground flex justify-between text-xs'>
      {marks.map((mark, idx) => (
        <span key={mark} className={idx === activeIndex ? 'text-foreground font-semibold' : undefined}>
          {format(mark)}
        </span>
      ))}
    </div>
  );
}
