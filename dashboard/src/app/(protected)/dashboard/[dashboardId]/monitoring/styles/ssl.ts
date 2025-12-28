import { type MonitorStatus } from '@/entities/analytics/monitoring.entities';
import { LucideIcon, ShieldAlert, ShieldX, ShieldCheck, Shield } from 'lucide-react';
import { type MonitorTone, type MonitorToneTheme, MONITOR_TONE, badgeClass } from './tone';
import { type MonitorStatusCategory, statusToTone } from './check';

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

export function isExpiredReason(reasonCode?: string | null, daysLeft?: number | null): boolean {
  return reasonCode === 'tls_expired' || (daysLeft != null && daysLeft <= 0);
}

export function presentSslStatus({
  status,
  daysLeft,
  reasonCode,
}: {
  status?: MonitorStatus | null;
  daysLeft?: number | null;
  reasonCode?: string | null;
}): SslPresentation {
  const category = resolveSslCategory(status, daysLeft);
  const tone = statusToTone(category);
  const theme = MONITOR_TONE[tone];
  const baseData = SSL_PRESENTATION[category];

  const isExpired = isExpiredReason(reasonCode, daysLeft);
  const labelKey: SslLabelKey = isExpired ? 'expired' : baseData.labelKey;
  const badgeLabelKey: SslBadgeLabelKey = isExpired ? 'badgeExpired' : baseData.badgeLabelKey;

  return {
    category,
    tone,
    theme,
    labelKey,
    badgeClass: badgeClass(theme),
    badgeLabelKey,
    badgeLabelShortKey: labelKey,
    icon: baseData.icon,
  };
}
