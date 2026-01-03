import { getMembersAction } from '@/app/actions/dashboard/members.action';
import { getPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';
import { getAuthSession } from '@/auth/auth-actions';
import { redirect } from 'next/navigation';
import { MembersPageClient } from './MembersPageClient';

interface MembersPageProps {
  params: Promise<{
    dashboardId: string;
  }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { dashboardId } = await params;
  const session = await getAuthSession();

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
        <h1 className='text-xl font-semibold'>Members</h1>
        <p className='text-muted-foreground text-sm'>Manage who has access to this dashboard</p>
      </div>

      <MembersPageClient
        dashboardId={dashboardId}
        currentUserId={session.user.id}
        initialMembers={members}
        initialInvitations={pendingInvitations}
      />
    </div>
  );
}
