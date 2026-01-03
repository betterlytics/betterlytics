'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { InvitationWithInviter } from '@/entities/dashboard/invitation.entities';
import { acceptInvitationAction, declineInvitationAction } from '@/app/actions/dashboard/invitations.action';
import { useRouter } from 'next/navigation';
import { RoleBadge } from '@/app/(protected)/dashboard/[dashboardId]/settings/members/member-utils';

interface PendingInvitationsModalProps {
  invitations: InvitationWithInviter[];
}

type ProcessingAction = 'accepting' | 'declining' | null;

export default function PendingInvitationsModal({
  invitations: initialInvitations,
}: PendingInvitationsModalProps) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(initialInvitations.length > 0);
  const [processingAction, setProcessingAction] = useState<ProcessingAction>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentInvitation = invitations[currentIndex];
  const isProcessing = processingAction !== null;

  const handleAccept = async () => {
    if (!currentInvitation) return;
    setProcessingAction('accepting');

    startTransition(async () => {
      const response = await acceptInvitationAction(currentInvitation.token);

      if (response.success) {
        const domain = currentInvitation.dashboard?.domain || 'dashboard';
        toast.success(`Joined ${domain} successfully!`);

        const remaining = invitations.filter((i) => i.id !== currentInvitation.id);
        if (remaining.length === 0) {
          setOpen(false);
          router.push(`/dashboard/${response.data}`);
        } else {
          setInvitations(remaining);
          setCurrentIndex(0);
        }
      } else {
        toast.error(response.error?.message || 'Failed to accept invitation');
      }

      setProcessingAction(null);
    });
  };

  const handleDecline = async () => {
    if (!currentInvitation) return;
    setProcessingAction('declining');

    startTransition(async () => {
      const response = await declineInvitationAction(currentInvitation.id);

      if (response.success) {
        toast.success('Invitation declined');

        const remaining = invitations.filter((i) => i.id !== currentInvitation.id);
        if (remaining.length === 0) {
          setOpen(false);
        } else {
          setInvitations(remaining);
          setCurrentIndex(0);
        }
      } else {
        toast.error(response.error?.message || 'Failed to decline invitation');
      }

      setProcessingAction(null);
    });
  };

  if (initialInvitations.length === 0 || !currentInvitation) {
    return null;
  }

  const inviterName = currentInvitation.invitedBy.name || currentInvitation.invitedBy.email || 'Someone';
  const domain = currentInvitation.dashboard?.domain || currentInvitation.dashboardId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Dashboard Invitation</DialogTitle>
          <DialogDescription>
            <span className='text-foreground font-medium'>{inviterName}</span> invited you to collaborate
          </DialogDescription>
        </DialogHeader>

        <div className='mt-2 space-y-4'>
          <div className='bg-muted/50 flex items-center gap-4 rounded-lg border p-4'>
            <div className='bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg'>
              <Globe className='size-6' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-lg font-semibold'>{domain}</p>
              <div className='mt-1'>
                <RoleBadge role={currentInvitation.role} />
              </div>
            </div>
          </div>

          <div className='flex gap-3'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={handleDecline}
              disabled={isProcessing || isPending}
            >
              {processingAction === 'declining' ? 'Declining...' : 'Decline'}
            </Button>
            <Button className='flex-1' onClick={handleAccept} disabled={isProcessing || isPending}>
              {processingAction === 'accepting' ? 'Accepting...' : 'Accept'}
            </Button>
          </div>

          {invitations.length > 1 && (
            <p className='text-muted-foreground text-center text-xs'>
              {currentIndex + 1} of {invitations.length} pending invitations
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
