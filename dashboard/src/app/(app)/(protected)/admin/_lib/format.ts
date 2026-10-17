import { formatDistanceToNowStrict } from 'date-fns';

export function formatDate(date: Date, includeTime = false): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  }).format(date);
}

export function formatRelative(date: Date | null): string {
  if (!date) return 'Never';
  if (Date.now() - date.getTime() < 60_000) return 'Just now';
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function parsePage(pageStr: string | undefined): number {
  return Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
}

const BROWSERS: Array<[RegExp, string]> = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const SYSTEMS: Array<[RegExp, string]> = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? 'Unknown device';
}

export function userDisplayName(user: { name: string | null; email: string; deletedAt?: Date | null }): string {
  if (user.deletedAt) return 'Deleted user';
  return user.name || user.email;
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  delete_user: 'Deleted user',
  disable_user: 'Disabled user',
  enable_user: 'Enabled user',
  set_instance_admin: 'Changed admin access',
  revoke_user_session: 'Signed out a session',
  revoke_user_sessions: 'Signed out all sessions',
  create_password_reset_link: 'Created password reset link',
  email_password_reset_link: 'Emailed password reset link',
  reset_two_factor: 'Reset two-factor',
  update_bug_report_status: 'Updated bug report',
};

export function describeAuditAction(action: string, payload: Record<string, unknown>): string {
  if (action === 'set_instance_admin') {
    return payload.isAdmin ? 'Made admin' : 'Removed admin';
  }
  return AUDIT_ACTION_LABELS[action] ?? action.replaceAll('_', ' ');
}
