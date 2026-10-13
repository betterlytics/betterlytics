export type AdminEdition = 'cloud' | 'selfhost';

export type AdminActor = {
  userId: string;
  email: string;
  edition: AdminEdition;
  twoFactorEnabled: boolean;
  sessionToken: string;
};

export const ADMIN_SECTIONS = {
  users: { label: 'Users', href: '/admin/users', editions: ['cloud', 'selfhost'] },
  'audit-log': { label: 'Audit log', href: '/admin/audit-log', editions: ['cloud', 'selfhost'] },
  'bug-reports': { label: 'Bug reports', href: '/admin/bug-reports', editions: ['cloud'] },
} as const satisfies Record<string, { label: string; href: string; editions: readonly AdminEdition[] }>;

export type AdminSectionKey = keyof typeof ADMIN_SECTIONS;

export function isAdminSectionAvailable(section: AdminSectionKey, edition: AdminEdition): boolean {
  return (ADMIN_SECTIONS[section].editions as readonly AdminEdition[]).includes(edition);
}

export function getAvailableAdminSections(edition: AdminEdition): AdminSectionKey[] {
  return (Object.keys(ADMIN_SECTIONS) as AdminSectionKey[]).filter((key) => isAdminSectionAvailable(key, edition));
}

export const ADMIN_TARGET_ACTIONS = [
  'disable',
  'enable',
  'change_role',
  'reset_password',
  'reset_two_factor',
  'revoke_sessions',
  'delete',
] as const;

export type AdminTargetAction = (typeof ADMIN_TARGET_ACTIONS)[number];

export type AdminTargetBlocker = 'self' | 'super_admin' | 'deleted' | 'not_available';

const SELF_BLOCKED_ACTIONS: readonly AdminTargetAction[] = [
  'disable',
  'change_role',
  'reset_password',
  'reset_two_factor',
  'delete',
];

export function resolveAdminTargetBlocker(params: {
  action: AdminTargetAction;
  edition: AdminEdition;
  actorUserId: string;
  target: { id: string; deletedAt: Date | null; isSuperAdmin: boolean };
}): AdminTargetBlocker | null {
  const { action, edition, actorUserId, target } = params;
  const isSelf = target.id === actorUserId;

  if (target.deletedAt) return 'deleted';
  if (action === 'change_role' && edition === 'cloud') return 'not_available';
  if (isSelf && SELF_BLOCKED_ACTIONS.includes(action)) return 'self';
  if (edition === 'cloud' && target.isSuperAdmin && !isSelf) return 'super_admin';
  return null;
}

export function resolveAdminTargetBlockers(params: {
  edition: AdminEdition;
  actorUserId: string;
  target: { id: string; deletedAt: Date | null; isSuperAdmin: boolean };
}): Record<AdminTargetAction, AdminTargetBlocker | null> {
  return Object.fromEntries(
    ADMIN_TARGET_ACTIONS.map((action) => [action, resolveAdminTargetBlocker({ ...params, action })]),
  ) as Record<AdminTargetAction, AdminTargetBlocker | null>;
}
