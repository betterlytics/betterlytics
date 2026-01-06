'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, X, UserPlus, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { RoleBadge, formatDate } from './member-utils';
import { inviteMemberAction, cancelInvitationAction } from '@/app/actions/dashboard/invitations.action';
import { InvitationWithInviter, CreateInvitationSchema } from '@/entities/dashboard/invitation.entities';
import { DashboardRole } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const InviteFormSchema = CreateInvitationSchema.pick({ email: true, role: true });

interface InviteSectionProps {
  dashboardId: string;
  pendingInvitations: InvitationWithInviter[];
}

export function InviteSection({ dashboardId, pendingInvitations }: InviteSectionProps) {
  const t = useTranslations('invitations.section');
  const tRoles = useTranslations('members.roles');
  const tToast = useTranslations('invitations.toast');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<DashboardRole>('viewer');
  const [isPending, startTransition] = useTransition();

  const handleInvite = () => {
    if (!email) return;

    const result = InviteFormSchema.safeParse({ email, role });
    if (!result.success) {
      toast.error(t('invalidEmail'));
      return;
    }

    startTransition(async () => {
      try {
        await inviteMemberAction(dashboardId, email, role);
        toast.success(tToast('sent'));
        setEmail('');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tToast('sendFailed'));
      }
    });
  };

  const handleCancelInvitation = (invitationId: string) => {
    startTransition(async () => {
      try {
        await cancelInvitationAction(dashboardId, invitationId);
        toast.success(tToast('cancelled'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tToast('cancelFailed'));
      }
    });
  };

  const hasPendingInvitations = pendingInvitations.length > 0;

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex-1 space-y-1.5'>
          <label className='text-muted-foreground text-sm'>{t('emailLabel')}</label>
          <Input
            type='email'
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          />
        </div>
        <div className='w-full space-y-1.5 sm:w-32'>
          <label className='text-muted-foreground text-sm'>{t('roleLabel')}</label>
          <Select value={role} onValueChange={(v) => setRole(v as DashboardRole)}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='admin'>{tRoles('admin')}</SelectItem>
              <SelectItem value='editor'>{tRoles('editor')}</SelectItem>
              <SelectItem value='viewer'>{tRoles('viewer')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleInvite} disabled={!email || isPending} className='sm:w-auto'>
          <Mail className='size-4' />
          {isPending ? t('sending') : t('inviteButton')}
        </Button>
      </div>

      {hasPendingInvitations && (
        <Collapsible className='group/advanced border-border border-t-1'>
          <CollapsibleTrigger className='hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between px-2 py-2'>
            <div className='flex items-center gap-1 text-sm'>
              <p className='text-muted-foreground'>{t('pending')}</p>
              <span className='text-muted-foreground/75'>({pendingInvitations.length})</span>
            </div>
            <ChevronDown className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]/advanced:rotate-180' />
          </CollapsibleTrigger>

          <CollapsibleContent className='overflow-hidden'>
            <div className='divide-border divide-y rounded-md border'>
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className='hover:bg-muted/30 flex items-center justify-between px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    <Avatar className='size-7'>
                      <AvatarFallback className='bg-muted text-muted-foreground text-xs'>
                        <Mail className='size-3' />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='text-sm font-medium'>{invitation.email}</p>
                      <p className='text-muted-foreground text-xs'>
                        {t('invited')} {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <RoleBadge role={invitation.role} />
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-muted-foreground hover:text-destructive size-7'
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={isPending}
                    >
                      <X className='size-3.5' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
