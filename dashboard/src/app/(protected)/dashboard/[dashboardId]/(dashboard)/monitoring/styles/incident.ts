import { type IncidentState } from '@/entities/analytics/monitoring.entities';
import { type MonitorTone, type MonitorToneTheme, MONITOR_TONE } from './tone';

export type IncidentStatePresentation = {
  tone: MonitorTone;
  theme: MonitorToneTheme;
  labelKey: IncidentState;
};

export function presentIncidentState(state: IncidentState): IncidentStatePresentation {
  const tone = state === 'ongoing' ? 'down' : 'ok';
  return { tone, theme: MONITOR_TONE[tone], labelKey: state };
}
