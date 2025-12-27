'use client';

import { Clock, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LabeledSlider } from '@/components/inputs/LabeledSlider';
import { formatCompactDuration } from '@/utils/dateFormatters';
import { SectionHeader } from './SectionHeader';
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
} from '../utils/sliderConstants';
import type { MonitorFormInterface } from '../types';

export type TimingSectionProps = {
  form: MonitorFormInterface;
  isPending: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

export function TimingSection({ form, isPending, open, onOpenChange, defaultOpen = true }: TimingSectionProps) {
  const tTiming = useTranslations('monitoringPage.form.timing');

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={open === undefined ? defaultOpen : undefined}
      className='group/timing'
    >
      <CollapsibleTrigger className='hover:bg-muted/50 -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors'>
        <SectionHeader icon={Clock} title={tTiming('title') ?? 'Timing & Sensitivity'} />
        <ChevronDown className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]/timing:rotate-180' />
      </CollapsibleTrigger>

      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden'>
        <div className='space-y-6 pt-4'>
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
            onValueChange={form.setField('intervalIdx')}
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
            onValueChange={form.setField('timeoutIdx')}
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
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
