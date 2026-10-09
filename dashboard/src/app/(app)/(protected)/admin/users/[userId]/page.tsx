import { notFound } from 'next/navigation';
import { getAdminUserAction } from '@/actions/admin/users.action';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { AdminPage } from '@/app/(app)/(protected)/admin/_components/AdminPage';
import { requireAdminPage } from '@/app/(app)/(protected)/admin/_lib/guard';
import { formatDate, userDisplayName } from '@/app/(app)/(protected)/admin/_lib/format';
import { UserStatusBadge } from '@/app/(app)/(protected)/admin/users/_components/UserBadges';
import { UserDetailView } from './UserDetailView';

type AdminUserPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserPage({ params }: AdminUserPageProps) {
  const { userId } = await params;
  const actor = await requireAdminPage('users');
  const result = await getAdminUserAction(userId);
  if (!result.success) throw new Error(result.error.message);

  const user = result.data;
  if (!user) notFound();

  const description = user.deletedAt
    ? `Deleted on ${formatDate(user.deletedAt)}`
    : user.name
      ? user.email
      : undefined;

  return (
    <AdminPage
      back={{ href: '/admin/users', label: 'All users' }}
      title={userDisplayName(user)}
      description={description}
      actions={<UserStatusBadge status={user.status} />}
    >
      <UserDetailView
        user={user}
        edition={actor.edition}
        actorUserId={actor.userId}
        emailsEnabled={isFeatureEnabled('enableEmails')}
      />
    </AdminPage>
  );
}
