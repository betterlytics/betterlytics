import { LiveIndicatorColor } from '@/components/live-indicator';
import { type MonitorOperationalState } from '@/entities/analytics/monitoring.entities';
import { type MonitorTone, type MonitorToneTheme, MONITOR_TONE, badgeClass } from './tone';

export const LATENCY_THRESHOLDS_MS = { fast: 500, elevated: 1500 };

type LatencyLabelKey = 'paused' | 'noData' | 'fast' | 'elevated' | 'slow';

export type LatencyPresentation = {
  tone: MonitorTone;
  theme: MonitorToneTheme;
  label: string;
  labelKey: LatencyLabelKey;
  indicator: LiveIndicatorColor;
  badgeClass: string;
};

const LATENCY_CLASSIFICATION: Record<LatencyLabelKey, { tone: MonitorTone; label: string }> = {
  paused: { tone: 'neutral', label: 'Paused' },
  noData: { tone: 'neutral', label: 'No data yet' },
  fast: { tone: 'ok', label: 'Fast' },
  elevated: { tone: 'warn', label: 'Elevated' },
  slow: { tone: 'down', label: 'Slow' },
};

function resolveLatencyKey(
  avgMs: number | null | undefined,
  operationalState: MonitorOperationalState,
): LatencyLabelKey {
  if (operationalState === 'paused') return 'paused';
  if (operationalState === 'preparing' || avgMs == null) return 'noData';
  if (avgMs <= LATENCY_THRESHOLDS_MS.fast) return 'fast';
  if (avgMs <= LATENCY_THRESHOLDS_MS.elevated) return 'elevated';
  return 'slow';
}

export function presentLatencyStatus({
  avgMs,
  operationalState,
}: {
  avgMs: number | null | undefined;
  operationalState: MonitorOperationalState;
}): LatencyPresentation {
  const labelKey = resolveLatencyKey(avgMs, operationalState);
  const { tone, label } = LATENCY_CLASSIFICATION[labelKey];
  const theme = MONITOR_TONE[tone];
  return { tone, theme, label, labelKey, indicator: theme.indicator, badgeClass: badgeClass(theme) };
}
