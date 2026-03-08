'use client';

import { Badge } from '@/components/ui/badge';
import { DashboardRole } from '@prisma/client';
import { useTranslations } from 'next-intl';
import type { SupportedLanguages } from '@/constants/i18n';

export type Role = DashboardRole;

export function getRoleBadgeClassName(role: Role): string {
  switch (role) {
    case 'owner':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'admin':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'editor':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'viewer':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-orange-600',
];

export function getAvatarColor(identifier: string | null | undefined): string {
  if (!identifier) return AVATAR_COLORS[0];

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash = hash & hash;
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function RoleBadge({ role }: { role: Role }) {
  const t = useTranslations('members.roles');
  return (
    <Badge variant='outline' className={getRoleBadgeClassName(role)}>
      {t(role)}
    </Badge>
  );
}

export function formatDate(date: Date, locale?: SupportedLanguages): string {
  return date.toLocaleDateString(locale);
}
