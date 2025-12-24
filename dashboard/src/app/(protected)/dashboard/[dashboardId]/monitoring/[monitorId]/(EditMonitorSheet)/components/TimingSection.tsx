'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
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
import { useMonitorForm } from '../hooks/useMonitorForm';

export type TimingSectionProps = {
  form: ReturnType<typeof useMonitorForm>;
  isPending: boolean;
};

export function TimingSection({ form, isPending }: TimingSectionProps) {
  const tTiming = useTranslations('monitoringPage.form.timing');

  return (
    <section className='space-y-6'>
      <SectionHeader icon={Clock} title={tTiming('title') ?? 'Timing & Sensitivity'} />

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
    </section>
  );
}
