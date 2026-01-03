'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DomainFavicon } from '@/components/domain/DomainFavicon';
import { toast } from 'sonner';
import { InvitationWithInviter } from '@/entities/dashboard/invitation.entities';
import { acceptInvitationAction, declineInvitationAction } from '@/app/actions/dashboard/invitations.action';
import { useRouter } from 'next/navigation';
import { RoleBadge } from '@/app/(protected)/dashboard/[dashboardId]/settings/members/member-utils';
import { useTranslations } from 'next-intl';

interface PendingInvitationsModalProps {
  invitations: InvitationWithInviter[];
}

type ProcessingAction = 'accepting' | 'declining' | null;

export default function PendingInvitationsModal({
  invitations: initialInvitations,
}: PendingInvitationsModalProps) {
  const t = useTranslations('invitations.pendingModal');
  const tToast = useTranslations('invitations.toast');
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
        toast.success(tToast('accepted', { domain }));

        const remaining = invitations.filter((i) => i.id !== currentInvitation.id);
        if (remaining.length === 0) {
          setOpen(false);
          router.push(`/dashboard/${response.data}`);
        } else {
          setInvitations(remaining);
          setCurrentIndex(0);
        }
      } else {
        toast.error(response.error?.message || tToast('acceptFailed'));
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
        toast.success(tToast('declined'));

        const remaining = invitations.filter((i) => i.id !== currentInvitation.id);
        if (remaining.length === 0) {
          setOpen(false);
        } else {
          setInvitations(remaining);
          setCurrentIndex(0);
        }
      } else {
        toast.error(response.error?.message || tToast('declineFailed'));
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
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('invitedBy', { name: inviterName })}</DialogDescription>
        </DialogHeader>

        <Card className='p-4'>
          <div className='flex items-center gap-4'>
            <div className='bg-muted flex size-12 shrink-0 items-center justify-center rounded-xl'>
              <DomainFavicon domain={domain} size={24} />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-lg font-semibold tracking-tight'>{domain}</p>
              <div className='mt-1.5'>
                <RoleBadge role={currentInvitation.role} />
              </div>
            </div>
          </div>
        </Card>

        {invitations.length > 1 && (
          <p className='text-muted-foreground text-center text-xs'>
            {t('pendingCount', { current: currentIndex + 1, total: invitations.length })}
          </p>
        )}

        <DialogFooter className='gap-2 sm:gap-2'>
          <Button
            variant='ghost'
            className='cursor-pointer'
            onClick={handleDecline}
            disabled={isProcessing || isPending}
          >
            {processingAction === 'declining' ? t('declining') : t('decline')}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isProcessing || isPending}
            className='min-w-[100px] cursor-pointer'
          >
            {processingAction === 'accepting' ? t('accepting') : t('accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
