'use server';

import { withAdminQuery, type AdminCtx } from '@/middlewares/withAdminAction';
import { getAuditLog } from '@/services/admin/auditLog.service';

export const getAuditLogAction = withAdminQuery('audit-log', async (_ctx: AdminCtx, page?: number) => {
  return getAuditLog(page);
});
