import { LiveIndicatorColor } from '@/components/live-indicator';
import { type MonitorOperationalState, type MonitorStatus } from '@/entities/analytics/monitoring.entities';
import { LucideIcon, ShieldAlert, ShieldX, ShieldCheck, Shield } from 'lucide-react';

// HTTP Status Code color categories
export type StatusCodeCategory = '2xx' | '3xx' | '4xx' | '5xx';

export const STATUS_CODE_COLORS: Record<StatusCodeCategory, { bg: string; text: string; border: string }> = {
  '2xx': {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
  },
  '3xx': {
    bg: 'bg-sky-500/20',
    text: 'text-sky-400',
    border: 'border-sky-500/40',
  },
  '4xx': {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
  },
  '5xx': {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/40',
  },
};

export function getStatusCodeCategory(code: number | string): StatusCodeCategory {
  const codeStr = String(code);
  if (codeStr.startsWith('2') || codeStr.toLowerCase() === '2xx') return '2xx';
  if (codeStr.startsWith('3') || codeStr.toLowerCase() === '3xx') return '3xx';
  if (codeStr.startsWith('4') || codeStr.toLowerCase() === '4xx') return '4xx';
  return '5xx';
}

export function getStatusCodeColorClasses(code: number | string): string {
  const category = getStatusCodeCategory(code);
  const colors = STATUS_CODE_COLORS[category];
  return `${colors.bg} ${colors.text} ${colors.border}`;
}

export type MonitorTone = 'ok' | 'warn' | 'down' | 'neutral';
export type MonitorStatusCategory = MonitorStatus | 'unknown';
export type MonitorToneTheme = (typeof MONITOR_TONE)[MonitorTone];

/** Label keys for operational state (used for i18n) */
export type OperationalStateLabelKey = 'paused' | 'preparing' | 'up' | 'degraded' | 'down' | 'error';
type LatencyLabelKey = 'paused' | 'noData' | 'fast' | 'elevated' | 'slow';
type SslLabelKey = 'valid' | 'expiringSoon' | 'expired' | 'error' | 'notChecked';
type SslBadgeLabelKey = 'badgeValid' | 'badgeExpiringSoon' | 'badgeExpired' | 'badgeError' | 'badgeNotChecked';
type SslBadgeLabelShortKey = 'valid' | 'expiringSoon' | 'expired' | 'error' | 'notChecked';

type PresentationBase = {
  tone: MonitorTone;
  theme: MonitorToneTheme;
  labelKey: string;
  badgeClass: string;
};

export type MonitorPresentation = PresentationBase & {
  operationalState: MonitorOperationalState;
  label: string;
  labelKey: OperationalStateLabelKey;
  indicator: LiveIndicatorColor;
  gradient: string;
};

export type CheckStatusPresentation = {
  tone: MonitorTone;
  theme: MonitorToneTheme;
  labelKey: MonitorStatus;
};

export type SslPresentation = PresentationBase & {
  category: MonitorStatusCategory;
  label: string;
  labelKey: SslLabelKey;
  badgeLabelFull: string;
  badgeLabelKey: SslBadgeLabelKey;
  badgeLabelShort: string;
  badgeLabelShortKey: SslBadgeLabelShortKey;
  icon: LucideIcon;
};

export type LatencyPresentation = PresentationBase & {
  label: string;
  labelKey: LatencyLabelKey;
  indicator: LiveIndicatorColor;
};

export const LATENCY_THRESHOLDS_MS = {
  fast: 500,
  elevated: 1500,
};

/** Maps operational state to display labels and i18n keys */
const OPERATIONAL_STATE_LABELS: Record<MonitorOperationalState, { label: string; key: OperationalStateLabelKey }> =
  {
    paused: { label: 'Paused', key: 'paused' },
    preparing: { label: 'Preparing', key: 'preparing' },
    up: { label: 'Up', key: 'up' },
    degraded: { label: 'Degraded', key: 'degraded' },
    down: { label: 'Down', key: 'down' },
    error: { label: 'Error', key: 'error' },
  };

const LATENCY_TONE_LABELS: Record<MonitorTone, { label: string; key: LatencyLabelKey }> = {
  neutral: { label: 'No data yet', key: 'noData' },
  ok: { label: 'Fast', key: 'fast' },
  warn: { label: 'Elevated', key: 'elevated' },
  down: { label: 'Slow', key: 'slow' },
};

const SSL_STATUS_LABELS: Record<MonitorStatusCategory, { label: string; key: SslLabelKey }> = {
  ok: { label: 'Valid', key: 'valid' },
  warn: { label: 'Expiring soon', key: 'expiringSoon' },
  down: { label: 'Expired', key: 'expired' },
  error: { label: 'Error', key: 'error' },
  unknown: { label: 'Not checked', key: 'notChecked' },
};

const SSL_BADGE_LABELS: Record<
  MonitorStatusCategory,
  {
    badgeLabelFull: string;
    badgeLabelKey: SslBadgeLabelKey;
    badgeLabelShort: string;
    badgeLabelShortKey: SslBadgeLabelShortKey;
  }
> = {
  ok: {
    badgeLabelFull: 'Certificate valid',
    badgeLabelKey: 'badgeValid',
    badgeLabelShort: 'Valid',
    badgeLabelShortKey: 'valid',
  },
  warn: {
    badgeLabelFull: 'Certificate expiring soon',
    badgeLabelKey: 'badgeExpiringSoon',
    badgeLabelShort: 'Expiring soon',
    badgeLabelShortKey: 'expiringSoon',
  },
  down: {
    badgeLabelFull: 'Certificate expired',
    badgeLabelKey: 'badgeExpired',
    badgeLabelShort: 'Expired',
    badgeLabelShortKey: 'expired',
  },
  error: {
    badgeLabelFull: 'Certificate error',
    badgeLabelKey: 'badgeError',
    badgeLabelShort: 'Error',
    badgeLabelShortKey: 'error',
  },
  unknown: {
    badgeLabelFull: 'Certificate not checked',
    badgeLabelKey: 'badgeNotChecked',
    badgeLabelShort: 'Not checked',
    badgeLabelShortKey: 'notChecked',
  },
};

const STATUS_TO_TONE: Record<MonitorStatusCategory, MonitorTone> = {
  ok: 'ok',
  warn: 'warn',
  down: 'down',
  error: 'down',
  unknown: 'neutral',
};

/** Maps operational state to visual tone */
const OPERATIONAL_STATE_TO_TONE: Record<MonitorOperationalState, MonitorTone> = {
  paused: 'neutral',
  preparing: 'neutral',
  up: 'ok',
  degraded: 'warn',
  down: 'down',
  error: 'down',
};

export const MONITOR_TONE: Record<
  MonitorTone,
  {
    text: string;
    badgeBg: string;
    badgeBorder: string;
    dot: string;
    ring: string;
    solid: string;
  }
> = {
  ok: {
    text: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-400/60',
    dot: 'bg-emerald-400',
    ring: 'bg-emerald-400/40',
    solid: 'bg-emerald-400/90',
  },
  warn: {
    text: 'text-amber-500',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-400/60',
    dot: 'bg-amber-300',
    ring: 'bg-amber-300/40',
    solid: 'bg-amber-400/80',
  },
  down: {
    text: 'text-red-400',
    badgeBg: 'bg-red-400/12',
    badgeBorder: 'border-red-400/30',
    dot: 'bg-red-500',
    ring: 'bg-red-300/30',
    solid: 'bg-red-400/70',
  },
  neutral: {
    text: 'text-muted-foreground',
    badgeBg: 'bg-muted/50',
    badgeBorder: 'border-secondary-foreground/50',
    dot: 'bg-muted-foreground',
    ring: 'bg-muted-foreground/30',
    solid: 'bg-muted',
  },
};

/** Convert operational state to visual tone */
export function operationalStateToTone(state: MonitorOperationalState): MonitorTone {
  return OPERATIONAL_STATE_TO_TONE[state];
}

function uptimeToneFromPercent(uptimePercent: number | null | undefined): MonitorTone {
  if (uptimePercent == null) return 'neutral';
  if (uptimePercent >= 99) return 'ok';
  if (uptimePercent >= 95) return 'warn';
  return 'down';
}

export function statusCategoryToTone(category: MonitorStatusCategory): MonitorTone {
  return STATUS_TO_TONE[category];
}

function resolveLatencyTone(
  avgMs: number | null | undefined,
  operationalState: MonitorOperationalState,
): MonitorTone {
  if (operationalState === 'paused' || operationalState === 'preparing') return 'neutral';
  if (avgMs == null) return 'neutral';
  if (avgMs <= LATENCY_THRESHOLDS_MS.fast) return 'ok';
  if (avgMs <= LATENCY_THRESHOLDS_MS.elevated) return 'warn';
  return 'down';
}

function latencyToneToLabel(tone: MonitorTone): { label: string; key: LatencyLabelKey } {
  return LATENCY_TONE_LABELS[tone];
}

/**
 * Present monitor status based on operational state.
 * This is the primary presentation function - takes the pre-computed operationalState.
 */
export function presentMonitorStatus(operationalState: MonitorOperationalState): MonitorPresentation {
  const tone = operationalStateToTone(operationalState);
  const theme = MONITOR_TONE[tone];
  const indicator: LiveIndicatorColor =
    tone === 'ok' ? 'green' : tone === 'warn' ? 'orange' : tone === 'down' ? 'red' : 'grey';
  const { label, key } = OPERATIONAL_STATE_LABELS[operationalState];
  const gradient = monitorStatusGradientForTone(tone);

  return {
    operationalState,
    tone,
    label,
    labelKey: key,
    indicator,
    theme,
    badgeClass: `${theme.badgeBorder} ${theme.badgeBg} ${theme.text}`,
    gradient,
  };
}

/**
 * Present a raw check status (for historical data like incidents, recent checks).
 */
export function presentCheckStatus(status: MonitorStatus): CheckStatusPresentation {
  const tone = STATUS_TO_TONE[status];
  const theme = MONITOR_TONE[tone];
  return { tone, theme, labelKey: status };
}

export function presentLatencyStatus({
  avgMs,
  operationalState,
}: {
  avgMs: number | null | undefined;
  operationalState: MonitorOperationalState;
}): LatencyPresentation {
  const tone = resolveLatencyTone(avgMs, operationalState);
  const theme = MONITOR_TONE[tone];
  const indicator: LiveIndicatorColor =
    tone === 'ok' ? 'green' : tone === 'warn' ? 'orange' : tone === 'down' ? 'red' : 'grey';
  const { label, key } =
    operationalState === 'paused' ? { label: 'Paused', key: 'paused' as const } : latencyToneToLabel(tone);

  return {
    tone,
    label,
    labelKey: key,
    indicator,
    theme,
    badgeClass: `${theme.badgeBorder} ${theme.badgeBg} ${theme.text}`,
  };
}

export function presentUptimeTone(uptimePercent: number | null | undefined): {
  tone: MonitorTone;
  theme: MonitorToneTheme;
} {
  const tone = uptimeToneFromPercent(uptimePercent);
  return { tone, theme: MONITOR_TONE[tone] };
}

export function presentSslStatus({
  status,
  daysLeft,
}: {
  status?: MonitorStatus | null;
  daysLeft?: number | null;
}): SslPresentation {
  const category = resolveSslStatusCategory(status, daysLeft);
  const tone = statusCategoryToTone(category);
  const theme = MONITOR_TONE[tone];
  const { label, key } = sslStatusCategoryToLabel(category);
  const { badgeLabelFull, badgeLabelKey, badgeLabelShort, badgeLabelShortKey } =
    sslStatusCategoryToBadgeLabelFull(category);
  const icon = sslStatusIconForCategory(category);
  return {
    category,
    icon,
    tone,
    label,
    labelKey: key,
    theme,
    badgeClass: `${theme.badgeBorder} ${theme.badgeBg} ${theme.text}`,
    badgeLabelFull,
    badgeLabelKey,
    badgeLabelShort,
    badgeLabelShortKey,
  };
}

export function sslStatusCategoryToLabel(category: MonitorStatusCategory): { label: string; key: SslLabelKey } {
  return SSL_STATUS_LABELS[category];
}

function resolveSslStatusCategory(status?: MonitorStatus | null, daysLeft?: number | null): MonitorStatusCategory {
  if (status === 'error') return 'error';

  if (daysLeft != null) {
    if (daysLeft <= 0) return 'down';
    if (daysLeft <= 30) return 'warn';
    return 'ok';
  }

  if (status === 'ok') return 'ok';
  if (status === 'warn') return 'warn';
  if (status === 'down') return 'down';

  return 'unknown';
}

function sslStatusCategoryToBadgeLabelFull(category: MonitorStatusCategory): {
  badgeLabelFull: string;
  badgeLabelKey: SslBadgeLabelKey;
  badgeLabelShort: string;
  badgeLabelShortKey: SslBadgeLabelShortKey;
} {
  return SSL_BADGE_LABELS[category];
}

function sslStatusIconForCategory(category: MonitorStatusCategory): LucideIcon {
  if (category === 'ok') return ShieldCheck;
  if (category === 'warn') return ShieldAlert;
  if (category === 'down') return ShieldX;
  return Shield;
}

function monitorStatusGradientForTone(tone: MonitorTone): string {
  const STATUS_GRADIENTS: Record<MonitorTone, string> = {
    ok: 'from-emerald-500/80 via-emerald-400/60 to-emerald-400/25',
    warn: 'from-amber-500/80 via-amber-400/60 to-amber-300/25',
    down: 'from-red-500/85 via-red-500/60 to-red-400/30',
    neutral: 'from-muted-foreground/50 via-muted-foreground/30 to-muted-foreground/10',
  };

  return STATUS_GRADIENTS[tone as keyof typeof STATUS_GRADIENTS] ?? STATUS_GRADIENTS.neutral;
}
