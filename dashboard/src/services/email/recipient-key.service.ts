'server-only';

import { createHash } from 'crypto';

export function createEmailRecipientKey(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = createHash('sha256').update(normalizedEmail).digest('hex');

  return `email:${hash}`;
}

export function createDashboardRecipientKey(dashboardId: string): string {
  return `dashboard:${dashboardId}`;
}
