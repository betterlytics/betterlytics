import { LiveIndicatorColor } from '@/components/live-indicator';

export type MonitorTone = 'ok' | 'warn' | 'down' | 'neutral';

export type MonitorToneTheme = {
  text: string;
  badgeBg: string;
  badgeBorder: string;
  dot: string;
  ring: string;
  solid: string;
  gradient: string;
  indicator: LiveIndicatorColor;
};

export const MONITOR_TONE: Record<MonitorTone, MonitorToneTheme> = {
  ok: {
    text: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-400/60',
    dot: 'bg-emerald-400',
    ring: 'bg-emerald-400/40',
    solid: 'bg-emerald-400/90',
    gradient: 'from-emerald-500/80 via-emerald-400/60 to-emerald-400/25',
    indicator: 'green',
  },
  warn: {
    text: 'text-amber-500',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-400/60',
    dot: 'bg-amber-300',
    ring: 'bg-amber-300/40',
    solid: 'bg-amber-400/80',
    gradient: 'from-amber-500/80 via-amber-400/60 to-amber-300/25',
    indicator: 'orange',
  },
  down: {
    text: 'text-red-400',
    badgeBg: 'bg-red-400/12',
    badgeBorder: 'border-red-400/30',
    dot: 'bg-red-500',
    ring: 'bg-red-300/30',
    solid: 'bg-red-400/70',
    gradient: 'from-red-500/85 via-red-500/60 to-red-400/30',
    indicator: 'red',
  },
  neutral: {
    text: 'text-muted-foreground',
    badgeBg: 'bg-muted/50',
    badgeBorder: 'border-secondary-foreground/50',
    dot: 'bg-muted-foreground',
    ring: 'bg-muted-foreground/30',
    solid: 'bg-muted',
    gradient: 'from-muted-foreground/50 via-muted-foreground/30 to-muted-foreground/10',
    indicator: 'grey',
  },
};

export function badgeClass(theme: MonitorToneTheme): string {
  return `${theme.badgeBorder} ${theme.badgeBg} ${theme.text}`;
}
