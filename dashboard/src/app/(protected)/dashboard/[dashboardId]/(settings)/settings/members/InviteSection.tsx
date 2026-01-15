'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { RoleBadge, formatDate } from './member-utils';
import { inviteMemberAction, cancelInvitationAction } from '@/app/actions/dashboard/invitations.action';
import { InvitationWithInviter, CreateInvitationSchema } from '@/entities/dashboard/invitation.entities';
import { DashboardRole } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

const InviteFormSchema = CreateInvitationSchema.pick({ email: true, role: true });

interface InviteSectionProps {
  dashboardId: string;
  pendingInvitations: InvitationWithInviter[];
}

export function InviteSection({ dashboardId, pendingInvitations }: InviteSectionProps) {
  const t = useTranslations('invitations');
  const tRoles = useTranslations('members.roles');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<DashboardRole>('viewer');
  const [isPending, startTransition] = useTransition();

  const handleInvite = () => {
    if (!email) return;

    const result = InviteFormSchema.safeParse({ email, role });
    if (!result.success) {
      toast.error(t('section.invalidEmail'));
      return;
    }

    startTransition(async () => {
      try {
        await inviteMemberAction(dashboardId, email, role);
        toast.success(t('toast.sent'));
        setEmail('');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.sendFailed'));
      }
    });
  };

  const handleCancelInvitation = (invitationId: string) => {
    startTransition(async () => {
      try {
        await cancelInvitationAction(dashboardId, invitationId);
        toast.success(t('toast.cancelled'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.cancelFailed'));
      }
    });
  };

  const hasPendingInvitations = pendingInvitations.length > 0;

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex-1 space-y-1.5'>
          <label className='text-muted-foreground text-sm'>{t('section.emailLabel')}</label>
          <PermissionGate>
            {(disabled) => (
              <Input
                type='email'
                className='text-sm'
                placeholder={t('section.emailPlaceholder')}
                value={email}
                disabled={disabled}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            )}
          </PermissionGate>
        </div>
        <div className='w-full space-y-1.5 sm:w-36'>
          <label className='text-muted-foreground text-sm'>{t('section.roleLabel')}</label>
          <PermissionGate>
            {(disabled) => (
              <Select value={role} onValueChange={(v) => setRole(v as DashboardRole)} disabled={disabled}>
                <SelectTrigger className='w-full cursor-pointer'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='admin' className='cursor-pointer'>
                    {tRoles('admin')}
                  </SelectItem>
                  <SelectItem value='editor' className='cursor-pointer'>
                    {tRoles('editor')}
                  </SelectItem>
                  <SelectItem value='viewer' className='cursor-pointer'>
                    {tRoles('viewer')}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </PermissionGate>
        </div>
        <PermissionGate>
          {(disabled) => (
            <Button
              onClick={handleInvite}
              disabled={!email || isPending || disabled}
              className='cursor-pointer sm:w-auto'
            >
              <Mail className='size-4' />
              {isPending ? t('section.sending') : t('section.inviteButton')}
            </Button>
          )}
        </PermissionGate>
      </div>

      {hasPendingInvitations && (
        <Collapsible className='group/advanced border-border border-t-1'>
          <CollapsibleTrigger className='hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between px-2 pt-4 pb-2'>
            <div className='flex items-center gap-1 text-sm'>
              <p className='text-muted-foreground'>{t('section.pending')}</p>
              <span className='text-muted-foreground/75'>({pendingInvitations.length})</span>
            </div>
            <ChevronDown className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]/advanced:rotate-180' />
          </CollapsibleTrigger>

          <CollapsibleContent className='overflow-hidden'>
            <div className='divide-border divide-y rounded-md border'>
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className='hover:bg-muted/30 px-4 py-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex min-w-0 items-center gap-3'>
                      <Avatar className='size-7 shrink-0'>
                        <AvatarFallback className='bg-muted text-muted-foreground text-xs'>
                          <Mail className='size-3' />
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium'>{invitation.email}</p>
                        <p className='text-muted-foreground hidden text-xs sm:block'>
                          {t('section.invited')} {formatDate(invitation.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      <div className='hidden sm:block'>
                        <RoleBadge role={invitation.role} />
                      </div>
                      <PermissionGate>
                        {(disabled) => (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-muted-foreground hover:text-destructive size-7 cursor-pointer'
                            onClick={() => handleCancelInvitation(invitation.id)}
                            disabled={isPending || disabled}
                          >
                            <X className='size-3.5' />
                          </Button>
                        )}
                      </PermissionGate>
                    </div>
                  </div>
                  <div className='mt-1.5 ml-10 flex items-center gap-2 sm:hidden'>
                    <RoleBadge role={invitation.role} />
                    <span className='text-muted-foreground text-xs'>
                      {t('section.invited')} {formatDate(invitation.createdAt)}
                    </span>
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
