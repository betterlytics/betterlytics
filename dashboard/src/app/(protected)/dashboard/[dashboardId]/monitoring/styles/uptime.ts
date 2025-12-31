import { type MonitorTone, type MonitorToneTheme, MONITOR_TONE } from './tone';

export function presentUptimeTone(uptimePercent: number | null | undefined): {
  tone: MonitorTone;
  theme: MonitorToneTheme;
} {
  let tone: MonitorTone = 'neutral';
  if (uptimePercent != null) {
    tone = uptimePercent >= 99 ? 'ok' : uptimePercent >= 95 ? 'warn' : 'down';
  }
  return { tone, theme: MONITOR_TONE[tone] };
}
