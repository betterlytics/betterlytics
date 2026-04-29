'use server';

import { withSuperAdminQuery, type SuperAdminCtx } from '@/middlewares/withSuperAdminAction';
import { getAuditLog } from '@/services/superadmin/auditLog.service';

export const getAuditLogAction = withSuperAdminQuery(async (_ctx: SuperAdminCtx, page?: number) => {
  return getAuditLog(page);
});
