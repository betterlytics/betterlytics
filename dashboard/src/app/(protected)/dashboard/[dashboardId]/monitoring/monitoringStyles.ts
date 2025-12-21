import { LiveIndicatorColor } from '@/components/live-indicator';
import { type MonitorOperationalState, type MonitorStatus } from '@/entities/analytics/monitoring.entities';
import { LucideIcon, ShieldAlert, ShieldX, ShieldCheck, Shield } from 'lucide-react';

export type MonitorTone = 'ok' | 'warn' | 'down' | 'neutral';
export type MonitorStatusCategory = MonitorStatus | 'unknown';

// Unified Tone Theme (single source of truth for all visual properties)
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

function badgeClass(theme: MonitorToneTheme): string {
  return `${theme.badgeBorder} ${theme.badgeBg} ${theme.text}`;
}

// Tone Mappings
const OPERATIONAL_STATE_TO_TONE: Record<MonitorOperationalState, MonitorTone> = {
  paused: 'neutral',
  preparing: 'neutral',
  up: 'ok',
  degraded: 'warn',
  down: 'down',
};

const STATUS_TO_TONE: Record<MonitorStatusCategory, MonitorTone> = {
  ok: 'ok',
  warn: 'warn',
  down: 'down',
  error: 'down',
  unknown: 'neutral',
};

export function operationalStateToTone(state: MonitorOperationalState): MonitorTone {
  return OPERATIONAL_STATE_TO_TONE[state];
}

export function statusCategoryToTone(category: MonitorStatusCategory): MonitorTone {
  return STATUS_TO_TONE[category];
}

// Monitor Status Presentation
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

const OPERATIONAL_STATE_LABELS: Record<MonitorOperationalState, string> = {
  paused: 'Paused',
  preparing: 'Preparing',
  up: 'Up',
  degraded: 'Degraded',
  down: 'Down',
};

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

// Check Status Presentation (for historical data)
export type CheckStatusPresentation = {
  tone: MonitorTone;
  theme: MonitorToneTheme;
  labelKey: MonitorStatus;
};

export function presentCheckStatus(status: MonitorStatus): CheckStatusPresentation {
  const tone = STATUS_TO_TONE[status];
  return { tone, theme: MONITOR_TONE[tone], labelKey: status };
}

// Latency Presentation
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

const LATENCY_LABELS: Record<MonitorTone, { label: string; key: LatencyLabelKey }> = {
  neutral: { label: 'No data yet', key: 'noData' },
  ok: { label: 'Fast', key: 'fast' },
  warn: { label: 'Elevated', key: 'elevated' },
  down: { label: 'Slow', key: 'slow' },
};

export function presentLatencyStatus({
  avgMs,
  operationalState,
}: {
  avgMs: number | null | undefined;
  operationalState: MonitorOperationalState;
}): LatencyPresentation {
  if (operationalState === 'paused' || operationalState === 'preparing') {
    const theme = MONITOR_TONE.neutral;
    const isPaused = operationalState === 'paused';
    return {
      tone: 'neutral',
      theme,
      label: isPaused ? 'Paused' : 'No data yet',
      labelKey: isPaused ? 'paused' : 'noData',
      indicator: theme.indicator,
      badgeClass: badgeClass(theme),
    };
  }

  let tone: MonitorTone = 'neutral';
  if (avgMs != null) {
    tone = avgMs <= LATENCY_THRESHOLDS_MS.fast ? 'ok' : avgMs <= LATENCY_THRESHOLDS_MS.elevated ? 'warn' : 'down';
  }

  const theme = MONITOR_TONE[tone];
  const { label, key } = LATENCY_LABELS[tone];
  return { tone, theme, label, labelKey: key, indicator: theme.indicator, badgeClass: badgeClass(theme) };
}

// Uptime Presentation
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

// SSL Presentation
type SslLabelKey = 'valid' | 'expiringSoon' | 'expired' | 'error' | 'notChecked';
type SslBadgeLabelKey = 'badgeValid' | 'badgeExpiringSoon' | 'badgeExpired' | 'badgeError' | 'badgeNotChecked';

export type SslPresentation = {
  category: MonitorStatusCategory;
  tone: MonitorTone;
  theme: MonitorToneTheme;
  label: string;
  labelKey: SslLabelKey;
  badgeClass: string;
  badgeLabelFull: string;
  badgeLabelKey: SslBadgeLabelKey;
  badgeLabelShort: string;
  badgeLabelShortKey: SslLabelKey;
  icon: LucideIcon;
};

const SSL_PRESENTATION: Record<
  MonitorStatusCategory,
  {
    label: string;
    labelKey: SslLabelKey;
    badgeLabelFull: string;
    badgeLabelKey: SslBadgeLabelKey;
    badgeLabelShort: string;
    icon: LucideIcon;
  }
> = {
  ok: {
    label: 'Valid',
    labelKey: 'valid',
    badgeLabelFull: 'Certificate valid',
    badgeLabelKey: 'badgeValid',
    badgeLabelShort: 'Valid',
    icon: ShieldCheck,
  },
  warn: {
    label: 'Expiring soon',
    labelKey: 'expiringSoon',
    badgeLabelFull: 'Certificate expiring soon',
    badgeLabelKey: 'badgeExpiringSoon',
    badgeLabelShort: 'Expiring soon',
    icon: ShieldAlert,
  },
  down: {
    label: 'Expired',
    labelKey: 'expired',
    badgeLabelFull: 'Certificate expired',
    badgeLabelKey: 'badgeExpired',
    badgeLabelShort: 'Expired',
    icon: ShieldX,
  },
  error: {
    label: 'Error',
    labelKey: 'error',
    badgeLabelFull: 'Certificate error',
    badgeLabelKey: 'badgeError',
    badgeLabelShort: 'Error',
    icon: Shield,
  },
  unknown: {
    label: 'Not checked',
    labelKey: 'notChecked',
    badgeLabelFull: 'Certificate not checked',
    badgeLabelKey: 'badgeNotChecked',
    badgeLabelShort: 'Not checked',
    icon: Shield,
  },
};

function resolveSslCategory(status?: MonitorStatus | null, daysLeft?: number | null): MonitorStatusCategory {
  if (status === 'error') return 'error';
  if (daysLeft != null) return daysLeft <= 0 ? 'down' : daysLeft <= 30 ? 'warn' : 'ok';
  if (status === 'ok' || status === 'warn' || status === 'down') return status;
  return 'unknown';
}

export function presentSslStatus({
  status,
  daysLeft,
}: {
  status?: MonitorStatus | null;
  daysLeft?: number | null;
}): SslPresentation {
  const category = resolveSslCategory(status, daysLeft);
  const tone = STATUS_TO_TONE[category];
  const theme = MONITOR_TONE[tone];
  const data = SSL_PRESENTATION[category];

  return {
    category,
    tone,
    theme,
    label: data.label,
    labelKey: data.labelKey,
    badgeClass: badgeClass(theme),
    badgeLabelFull: data.badgeLabelFull,
    badgeLabelKey: data.badgeLabelKey,
    badgeLabelShort: data.badgeLabelShort,
    badgeLabelShortKey: data.labelKey,
    icon: data.icon,
  };
}
