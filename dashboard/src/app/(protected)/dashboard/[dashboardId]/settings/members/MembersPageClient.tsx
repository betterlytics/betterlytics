'use client';

import { InviteSection } from './InviteSection';
import { MembersTable } from './MembersTable';
import { DashboardMember, InvitationWithInviter } from '@/entities/dashboard/invitation.entities';

interface MembersPageClientProps {
  dashboardId: string;
  currentUserId: string;
  initialMembers: DashboardMember[];
  initialInvitations: InvitationWithInviter[];
}

export function MembersPageClient({
  dashboardId,
  currentUserId,
  initialMembers,
  initialInvitations,
}: MembersPageClientProps) {
  return (
    <>
      <InviteSection dashboardId={dashboardId} pendingInvitations={initialInvitations} />
      <MembersTable dashboardId={dashboardId} members={initialMembers} currentUserId={currentUserId} />
    </>
  );
}
