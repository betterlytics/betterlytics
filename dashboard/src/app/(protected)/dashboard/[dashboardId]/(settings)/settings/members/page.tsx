import { getMembersAction } from '@/app/actions/dashboard/members.action';
import { getPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';
import { getAuthSession } from '@/auth/auth-actions';
import { redirect } from 'next/navigation';
import { MembersTable } from './MembersTable';
import { InviteSection } from './InviteSection';
import { getTranslations } from 'next-intl/server';
import { LeaveDashboardSection } from './LeaveDashboardSection';
import SettingsPageHeader from '../SettingsPageHeader';
import SettingsSection from '../SettingsSection';

interface MembersPageProps {
  params: Promise<{
    dashboardId: string;
  }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { dashboardId } = await params;
  const session = await getAuthSession();
  const t = await getTranslations('members');
  const tSidebar = await getTranslations('dashboard.settings.sidebar');

  if (!session?.user?.id) {
    redirect('/signin');
  }

  const [members, pendingInvitations] = await Promise.all([
    getMembersAction(dashboardId),
    getPendingInvitationsAction(dashboardId),
  ]);

  const currentMember = members.find((m) => m.userId === session.user.id);
  const currentUserRole = currentMember?.role || 'viewer';

  return (
    <div>
      <SettingsPageHeader title={tSidebar('members')} />
      <div className='space-y-12'>
        <SettingsSection title={t('settings.invite.title')} description={t('settings.invite.description')}>
          <InviteSection dashboardId={dashboardId} pendingInvitations={pendingInvitations} />
        </SettingsSection>

        <SettingsSection title={t('settings.activeMembers.title')}>
          <MembersTable
            dashboardId={dashboardId}
            members={members}
            currentUserId={session.user.id}
            currentUserRole={currentUserRole}
          />
        </SettingsSection>
        {currentUserRole === 'owner' && (
          <SettingsSection title={t('settings.leaveDashboard.title')}>
            <LeaveDashboardSection />
          </SettingsSection>
        )}
      </div>
    </div>
  );
}
