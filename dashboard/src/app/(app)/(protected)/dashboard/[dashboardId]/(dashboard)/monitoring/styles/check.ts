import { type MonitorStatus } from '@/entities/analytics/monitoring.entities';
import { type MonitorTone, type MonitorToneTheme, MONITOR_TONE } from './tone';

export type MonitorStatusCategory = MonitorStatus | 'unknown';

const STATUS_TO_TONE: Record<MonitorStatusCategory, MonitorTone> = {
  ok: 'ok',
  warn: 'warn',
  failed: 'down',
  unknown: 'neutral',
};

export type CheckStatusPresentation = {
  tone: MonitorTone;
  theme: MonitorToneTheme;
  labelKey: MonitorStatus;
};

export function statusToTone(status: MonitorStatusCategory): MonitorTone {
  return STATUS_TO_TONE[status];
}

export function presentCheckStatus(status: MonitorStatus): CheckStatusPresentation {
  const tone = STATUS_TO_TONE[status];
  return { tone, theme: MONITOR_TONE[tone], labelKey: status };
}
