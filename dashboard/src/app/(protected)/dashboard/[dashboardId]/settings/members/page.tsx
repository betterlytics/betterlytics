import { getMembersAction } from '@/app/actions/dashboard/members.action';
import { getPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';
import { getAuthSession } from '@/auth/auth-actions';
import { redirect } from 'next/navigation';
import { MembersTable } from './MembersTable';
import { InviteSection } from './InviteSection';
import { getTranslations } from 'next-intl/server';

interface MembersPageProps {
  params: Promise<{
    dashboardId: string;
  }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { dashboardId } = await params;
  const session = await getAuthSession();
  const t = await getTranslations('members.page');

  if (!session?.user?.id) {
    redirect('/signin');
  }

  const [members, pendingInvitations] = await Promise.all([
    getMembersAction(dashboardId),
    getPendingInvitationsAction(dashboardId),
  ]);

  return (
    <div className='container max-w-4xl space-y-6 p-2 pt-4 sm:p-6'>
      <div className='space-y-1'>
        <h1 className='text-xl font-semibold'>{t('title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      <InviteSection dashboardId={dashboardId} pendingInvitations={pendingInvitations} />
      <MembersTable dashboardId={dashboardId} members={members} currentUserId={session.user.id} />
    </div>
  );
}
