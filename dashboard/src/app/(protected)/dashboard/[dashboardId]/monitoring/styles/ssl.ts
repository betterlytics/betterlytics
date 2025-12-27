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

export function presentSslStatus({
  status,
  daysLeft,
}: {
  status?: MonitorStatus | null;
  daysLeft?: number | null;
}): SslPresentation {
  const category = resolveSslCategory(status, daysLeft);
  const tone = statusToTone(category);
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
