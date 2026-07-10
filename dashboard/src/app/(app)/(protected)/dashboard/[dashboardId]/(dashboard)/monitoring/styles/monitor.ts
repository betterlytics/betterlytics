import { LiveIndicatorColor } from '@/components/live-indicator';
import { type MonitorOperationalState } from '@/entities/analytics/monitoring.entities';
import { type MonitorTone, type MonitorToneTheme, MONITOR_TONE, badgeClass } from './tone';

const OPERATIONAL_STATE_TO_TONE: Record<MonitorOperationalState, MonitorTone> = {
  paused: 'neutral',
  preparing: 'neutral',
  up: 'ok',
  degraded: 'warn',
  down: 'down',
};

const OPERATIONAL_STATE_LABELS: Record<MonitorOperationalState, string> = {
  paused: 'Paused',
  preparing: 'Preparing',
  up: 'Up',
  degraded: 'Degraded',
  down: 'Down',
};

export type MonitorPresentation = {
  operationalState: MonitorOperationalState;
  tone: MonitorTone;
  theme: MonitorToneTheme;
  label: string;
  labelKey: MonitorOperationalState;
  indicator: LiveIndicatorColor;
  gradient: string;
  badgeClass: string;
};

export function operationalStateToTone(state: MonitorOperationalState): MonitorTone {
  return OPERATIONAL_STATE_TO_TONE[state];
}

export function presentMonitorStatus(operationalState: MonitorOperationalState): MonitorPresentation {
  const tone = OPERATIONAL_STATE_TO_TONE[operationalState];
  const theme = MONITOR_TONE[tone];
  return {
    operationalState,
    tone,
    theme,
    label: OPERATIONAL_STATE_LABELS[operationalState],
    labelKey: operationalState,
    indicator: theme.indicator,
    gradient: theme.gradient,
    badgeClass: badgeClass(theme),
  };
}
