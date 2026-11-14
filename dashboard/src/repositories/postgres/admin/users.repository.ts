import 'server-only';

import { Prisma } from '@prisma/client';
import prisma from '@/lib/postgres';
import {
  AdminTransferCandidateSchema,
  AdminUserDashboardSchema,
  AdminUserDetailSchema,
  AdminUserSummarySchema,
  AdminUserTargetSchema,
  type AdminTransferCandidate,
  type AdminUserDetail,
  type AdminUserListQuery,
  type AdminUserStatus,
  type AdminUserSummary,
  type AdminUserTarget,
} from '@/entities/admin/adminUser.entities';
import { ADMIN_PAGE_SIZE } from '@/constants/admin';

const CREDENTIAL_PROVIDER_ID = 'credential';
const TRANSFER_CANDIDATE_LIMIT = 500;

const STATUS_WHERE: Record<AdminUserStatus, Prisma.UserWhereInput> = {
  active: { deletedAt: null, disabledAt: null },
  disabled: { deletedAt: null, disabledAt: { not: null } },
  deleted: { deletedAt: { not: null } },
};

const SUMMARY_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  twoFactorEnabled: true,
  createdAt: true,
  lastActiveAt: true,
  disabledAt: true,
  deletedAt: true,
  _count: {
    select: {
      dashboardAccess: { where: { deletedAt: null, dashboard: { deletedAt: null } } },
      accounts: { where: { providerId: CREDENTIAL_PROVIDER_ID, password: { not: null } } },
    },
  },
} satisfies Prisma.UserSelect;

type SummaryRow = Prisma.UserGetPayload<{ select: typeof SUMMARY_SELECT }>;

function toSummary(row: SummaryRow): AdminUserSummary {
  const { _count, ...user } = row;
  return AdminUserSummarySchema.parse({
    ...user,
    dashboardCount: _count.dashboardAccess,
    hasPassword: _count.accounts > 0,
  });
}

function searchWhere(search: string | undefined): Prisma.UserWhereInput {
  if (!search) return {};
  return {
    OR: [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ],
  };
}

export async function listAdminUsers(
  query: AdminUserListQuery,
): Promise<{ users: AdminUserSummary[]; total: number }> {
  const where: Prisma.UserWhereInput = { ...STATUS_WHERE[query.status], ...searchWhere(query.search) };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SUMMARY_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: ADMIN_PAGE_SIZE,
      skip: (query.page - 1) * ADMIN_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return { users: rows.map(toSummary), total };
}

export async function countAdminUsersByStatus(search?: string): Promise<Record<AdminUserStatus, number>> {
  const [active, disabled, deleted] = await Promise.all(
    (['active', 'disabled', 'deleted'] as const).map((status) =>
      prisma.user.count({ where: { ...STATUS_WHERE[status], ...searchWhere(search) } }),
    ),
  );
  return { active, disabled, deleted };
}

export async function findAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...SUMMARY_SELECT,
      accounts: { where: { providerId: { not: CREDENTIAL_PROVIDER_ID } }, select: { providerId: true } },
      dashboardAccess: {
        where: { deletedAt: null, dashboard: { deletedAt: null } },
        select: { role: true, dashboard: { select: { id: true, domain: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!row) return null;

  const { accounts, dashboardAccess, ...summaryRow } = row;
  return AdminUserDetailSchema.parse({
    ...toSummary(summaryRow),
    oauthProviders: accounts.map((account) => account.providerId),
    dashboards: dashboardAccess.map((access) =>
      AdminUserDashboardSchema.parse({
        dashboardId: access.dashboard.id,
        domain: access.dashboard.domain,
        role: access.role,
      }),
    ),
    sessions: [],
  });
}

export async function findAdminUserTarget(userId: string): Promise<AdminUserTarget | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      twoFactorEnabled: true,
      disabledAt: true,
      deletedAt: true,
      _count: { select: { accounts: { where: { providerId: CREDENTIAL_PROVIDER_ID, password: { not: null } } } } },
    },
  });
  if (!row) return null;

  const { _count, ...user } = row;
  return AdminUserTargetSchema.parse({ ...user, hasPassword: _count.accounts > 0 });
}

export async function findTransferCandidates(excludeUserId: string): Promise<AdminTransferCandidate[]> {
  const rows = await prisma.user.findMany({
    where: { id: { not: excludeUserId }, deletedAt: null, disabledAt: null },
    select: { id: true, email: true, name: true },
    orderBy: { email: 'asc' },
    take: TRANSFER_CANDIDATE_LIMIT,
  });
  return rows.map((row) => AdminTransferCandidateSchema.parse(row));
}
