import { z } from 'zod';
import { DashboardRole, UserRole } from '@prisma/client';
import type { AdminTargetAction, AdminTargetBlocker } from '@/entities/admin/adminAccess.entities';

export const ADMIN_USER_STATUSES = ['active', 'disabled', 'deleted'] as const;

export const AdminUserStatusSchema = z.enum(ADMIN_USER_STATUSES);

export type AdminUserStatus = z.infer<typeof AdminUserStatusSchema>;

export const AdminUserListQuerySchema = z.object({
  search: z.string().trim().max(254).optional(),
  status: AdminUserStatusSchema.default('active'),
  page: z.number().int().min(1).default(1),
});

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;

export const AdminUserSummarySchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.nativeEnum(UserRole).nullable(),
  twoFactorEnabled: z.boolean(),
  hasPassword: z.boolean(),
  dashboardCount: z.number().int(),
  createdAt: z.date(),
  lastActiveAt: z.date().nullable(),
  disabledAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
});

export type AdminUserSummary = z.infer<typeof AdminUserSummarySchema>;

export const AdminUserSessionSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
});

export type AdminUserSession = z.infer<typeof AdminUserSessionSchema>;

export const AdminUserDashboardSchema = z.object({
  dashboardId: z.string(),
  domain: z.string(),
  role: z.nativeEnum(DashboardRole),
});

export type AdminUserDashboard = z.infer<typeof AdminUserDashboardSchema>;

export const AdminUserDetailSchema = AdminUserSummarySchema.extend({
  oauthProviders: z.array(z.string()),
  dashboards: z.array(AdminUserDashboardSchema),
  sessions: z.array(AdminUserSessionSchema),
});

export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;

export const AdminUserTargetSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.nativeEnum(UserRole).nullable(),
  twoFactorEnabled: z.boolean(),
  hasPassword: z.boolean(),
  disabledAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
});

export type AdminUserTarget = z.infer<typeof AdminUserTargetSchema>;

export const AdminTransferCandidateSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
});

export type AdminTransferCandidate = z.infer<typeof AdminTransferCandidateSchema>;

export const AdminDeleteUserInputSchema = z.discriminatedUnion('ownedDashboards', [
  z.object({ ownedDashboards: z.literal('delete') }),
  z.object({ ownedDashboards: z.literal('transfer'), transferToUserId: z.string().min(1) }),
]);

export type AdminDeleteUserInput = z.infer<typeof AdminDeleteUserInputSchema>;

export type AdminUserActions = Record<AdminTargetAction, AdminTargetBlocker | null>;

export type AdminUserListEntry = AdminUserSummary & {
  status: AdminUserStatus;
  isSelf: boolean;
  isSuperAdmin: boolean;
  actions: AdminUserActions;
};

export type AdminUserListResult = {
  users: AdminUserListEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: Record<AdminUserStatus, number>;
};

export type AdminUserView = Omit<AdminUserDetail, 'sessions'> & {
  status: AdminUserStatus;
  isSelf: boolean;
  isSuperAdmin: boolean;
  actions: AdminUserActions;
  sessions: Array<AdminUserSession & { isCurrent: boolean }>;
};

export type AdminDeleteUserContext = {
  ownedDashboards: Array<{ dashboardId: string; domain: string }>;
  transferCandidates: AdminTransferCandidate[];
  canTransfer: boolean;
};

export function resolveAdminUserStatus(user: {
  disabledAt: Date | null;
  deletedAt: Date | null;
}): AdminUserStatus {
  if (user.deletedAt) return 'deleted';
  if (user.disabledAt) return 'disabled';
  return 'active';
}
