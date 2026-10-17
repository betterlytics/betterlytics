import { Suspense } from 'react';
import { getAdminUsersAction } from '@/actions/admin/users.action';
import { AdminUserStatusSchema, type AdminUserStatus } from '@/entities/admin/adminUser.entities';
import { WarningBanner } from '@/components/WarningBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { AdminPage } from '@/app/(app)/(protected)/admin/_components/AdminPage';
import { AdminPagination } from '@/app/(app)/(protected)/admin/_components/AdminPagination';
import { SearchInput } from '@/app/(app)/(protected)/admin/_components/SearchInput';
import { parsePage } from '@/app/(app)/(protected)/admin/_lib/format';
import { requireAdminPage } from '@/app/(app)/(protected)/admin/_lib/guard';
import { StatusTabs } from './_components/StatusTabs';
import { UsersTable } from './_components/UsersTable';

type AdminUsersPageProps = {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
};

const EMPTY_MESSAGES: Record<AdminUserStatus, string> = {
  active: 'No users match your search.',
  disabled: 'No disabled users.',
  deleted: 'No deleted users.',
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const status = AdminUserStatusSchema.catch('active').parse(params.status);
  const search = params.search?.trim() || undefined;

  const actor = await requireAdminPage('users');
  const result = await getAdminUsersAction({ search, status, page: parsePage(params.page) });
  if (!result.success) throw new Error(result.error.message);
  const { users, total, page, pageSize, totalPages, statusCounts } = result.data;

  return (
    <AdminPage
      width='wide'
      title='Users'
      description={
        actor.edition === 'selfhost' ? 'Everyone with an account on this instance.' : 'Every account on Betterlytics Cloud.'
      }
    >
      {actor.edition === 'selfhost' && !actor.twoFactorEnabled && (
        <WarningBanner
          className='mb-6'
          title='Protect your admin account with two-factor authentication'
          description='Admins can disable, delete and reset every user here. Turn it on under Settings, Account.'
        />
      )}

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <StatusTabs active={status} counts={statusCounts} search={search} />
        <Suspense>
          <SearchInput placeholder='Search name or email' />
        </Suspense>
      </div>

      <UsersTable
        users={users}
        edition={actor.edition}
        actorUserId={actor.userId}
        emailsEnabled={isFeatureEnabled('enableEmails')}
        emptyMessage={search ? 'No users match your search.' : EMPTY_MESSAGES[status]}
      />

      <Suspense>
        <AdminPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </AdminPage>
  );
}
