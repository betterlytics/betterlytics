'use client';

import { use } from 'react';
import PendingInvitationsModal from './PendingInvitationsModal';
import { getUserPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';

interface PendingInvitationsWrapperProps {
  invitationsPromise: ReturnType<typeof getUserPendingInvitationsAction>;
}

export function PendingInvitationsWrapper({ invitationsPromise }: PendingInvitationsWrapperProps) {
  const invitationsResult = use(invitationsPromise);
  const invitations = invitationsResult.success ? invitationsResult.data : [];

  return <PendingInvitationsModal invitations={invitations} />;
}
