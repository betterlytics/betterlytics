import { LiveIndicatorColor } from '@/components/live-indicator';
import {
  type IncidentState,
  type MonitorOperationalState,
  type MonitorStatus,
} from '@/entities/analytics/monitoring.entities';
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
  failed: 'down',
  unknown: 'neutral',
};

export function operationalStateToTone(state: MonitorOperationalState): MonitorTone {
  return OPERATIONAL_STATE_TO_TONE[state];
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

// Check Status Presentation
export type CheckStatusPresentation = {
  tone: MonitorTone;
  theme: MonitorToneTheme;
  labelKey: MonitorStatus;
};

export function presentCheckStatus(status: MonitorStatus): CheckStatusPresentation {
  const tone = STATUS_TO_TONE[status];
  return { tone, theme: MONITOR_TONE[tone], labelKey: status };
}

// Incident State Presentation
export type IncidentStatePresentation = {
  tone: MonitorTone;
  theme: MonitorToneTheme;
  labelKey: IncidentState;
};

export function presentIncidentState(state: IncidentState): IncidentStatePresentation {
  const tone = state === 'ongoing' ? 'down' : 'ok';
  return { tone, theme: MONITOR_TONE[tone], labelKey: state };
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
  labelKey: SslLabelKey;
  badgeClass: string;
  badgeLabelKey: SslBadgeLabelKey;
  badgeLabelShortKey: SslLabelKey;
  icon: LucideIcon;
};

const SSL_PRESENTATION: Record<
  MonitorStatusCategory,
  {
    labelKey: SslLabelKey;
    badgeLabelKey: SslBadgeLabelKey;
    icon: LucideIcon;
  }
> = {
  ok: {
    labelKey: 'valid',
    badgeLabelKey: 'badgeValid',
    icon: ShieldCheck,
  },
  warn: {
    labelKey: 'expiringSoon',
    badgeLabelKey: 'badgeExpiringSoon',
    icon: ShieldAlert,
  },
  failed: {
    labelKey: 'error',
    badgeLabelKey: 'badgeError',
    icon: ShieldX,
  },
  unknown: {
    labelKey: 'notChecked',
    badgeLabelKey: 'badgeNotChecked',
    icon: Shield,
  },
};

function resolveSslCategory(status?: MonitorStatus | null, daysLeft?: number | null): MonitorStatusCategory {
  if (status === 'failed') return 'failed';
  if (daysLeft != null) return daysLeft <= 0 ? 'failed' : daysLeft <= 30 ? 'warn' : 'ok';
  if (status === 'ok' || status === 'warn') return status;
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
    labelKey: data.labelKey,
    badgeClass: badgeClass(theme),
    badgeLabelKey: data.badgeLabelKey,
    badgeLabelShortKey: data.labelKey,
    icon: data.icon,
  };
}
