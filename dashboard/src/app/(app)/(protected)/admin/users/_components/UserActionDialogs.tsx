'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { DestructiveActionDialog } from '@/components/dialogs';
import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  createPasswordResetLinkAction,
  deleteUserAction,
  disableUserAction,
  emailPasswordResetLinkAction,
  getDeleteUserContextAction,
  resetTwoFactorAction,
  setInstanceAdminAction,
} from '@/actions/admin/users.action';
import type { AdminDeleteUserContext } from '@/entities/admin/adminUser.entities';
import { formatDate, userDisplayName } from '@/app/(app)/(protected)/admin/_lib/format';
import { AdminConfirmDialog } from '@/app/(app)/(protected)/admin/_components/AdminConfirmDialog';
import { useAdminMutation } from './useAdminMutation';

export type AdminDialogUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user' | null;
  deletedAt: Date | null;
};

export type AdminUserDialog = 'disable' | 'promote' | 'demote' | 'reset-password' | 'reset-two-factor' | 'delete';

type UserActionDialogsProps = {
  user: AdminDialogUser;
  dialog: AdminUserDialog | null;
  onClose: () => void;
  actorUserId: string;
  emailsEnabled: boolean;
  redirectAfterDelete?: string;
};

export function UserActionDialogs({
  user,
  dialog,
  onClose,
  actorUserId,
  emailsEnabled,
  redirectAfterDelete,
}: UserActionDialogsProps) {
  const label = userDisplayName(user);
  const lastRoleDialog = useRef<'promote' | 'demote'>('promote');
  if (dialog === 'promote' || dialog === 'demote') lastRoleDialog.current = dialog;

  const onOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <>
      <DisableUserDialog user={user} label={label} open={dialog === 'disable'} onOpenChange={onOpenChange} />
      <RoleChangeDialog
        user={user}
        label={label}
        makeAdmin={lastRoleDialog.current === 'promote'}
        open={dialog === 'promote' || dialog === 'demote'}
        onOpenChange={onOpenChange}
      />
      <ResetPasswordDialog
        user={user}
        label={label}
        emailsEnabled={emailsEnabled}
        open={dialog === 'reset-password'}
        onOpenChange={onOpenChange}
      />
      <ResetTwoFactorDialog user={user} label={label} open={dialog === 'reset-two-factor'} onOpenChange={onOpenChange} />
      {dialog === 'delete' && (
        <DeleteUserDialog
          user={user}
          label={label}
          actorUserId={actorUserId}
          redirectTo={redirectAfterDelete}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
}

type DialogProps = {
  user: AdminDialogUser;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DisableUserDialog({ user, label, open, onOpenChange }: DialogProps) {
  const { run, isPending } = useAdminMutation();

  return (
    <AdminConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Disable ${label}?`}
      description="They are signed out everywhere and can't sign in or use their MCP tokens until you enable them again. Their dashboards and data stay as they are."
      confirmLabel='Disable'
      destructive
      isPending={isPending}
      onConfirm={() =>
        run(() => disableUserAction(user.id), { success: `${label} was disabled`, onSuccess: () => onOpenChange(false) })
      }
    />
  );
}

function RoleChangeDialog({ user, label, makeAdmin, open, onOpenChange }: DialogProps & { makeAdmin: boolean }) {
  const { run, isPending } = useAdminMutation();

  return (
    <AdminConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={makeAdmin ? `Make ${label} an admin?` : `Remove admin access from ${label}?`}
      description={
        makeAdmin
          ? 'Admins can open this panel and manage every user on this instance, including other admins.'
          : 'They keep their account and dashboards but can no longer open the admin panel.'
      }
      confirmLabel={makeAdmin ? 'Make admin' : 'Remove admin'}
      destructive={!makeAdmin}
      isPending={isPending}
      onConfirm={() =>
        run(() => setInstanceAdminAction(user.id, makeAdmin), {
          success: makeAdmin ? `${label} is now an admin` : `${label} is no longer an admin`,
          onSuccess: () => onOpenChange(false),
        })
      }
    />
  );
}

function ResetTwoFactorDialog({ user, label, open, onOpenChange }: DialogProps) {
  const { run, isPending } = useAdminMutation();

  return (
    <AdminConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Reset two-factor authentication?'
      description={`${label} can sign in with just their password and set up two-factor again. Their trusted devices are forgotten and they are signed out everywhere.`}
      confirmLabel='Reset two-factor'
      destructive
      isPending={isPending}
      onConfirm={() =>
        run(() => resetTwoFactorAction(user.id), {
          success: `Two-factor was reset for ${label}`,
          onSuccess: () => onOpenChange(false),
        })
      }
    />
  );
}

function ResetPasswordDialog({ user, label, emailsEnabled, open, onOpenChange }: DialogProps & { emailsEnabled: boolean }) {
  const { run, isPending } = useAdminMutation();
  const [link, setLink] = useState<{ url: string; expiresAt: Date } | null>(null);

  useEffect(() => {
    if (!open) setLink(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Create a one-time link that lets {label} choose a new password. It works for 24 hours and replaces any
            earlier link. Using it signs them out everywhere.
          </DialogDescription>
        </DialogHeader>

        {link && (
          <div className='space-y-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3'>
            <div className='flex items-center gap-2'>
              <Input readOnly value={link.url} className='font-mono text-xs' aria-label='Password reset link' />
              <CopyButton
                text={link.url}
                ariaLabel='Copy reset link'
                copiedLabel='Link copied'
                className='hover:bg-accent shrink-0 cursor-pointer rounded-md p-2'
                iconClassName='h-4 w-4'
              />
            </div>
            <p className='text-muted-foreground text-xs'>
              Share it with {label} privately. Expires {formatDate(link.expiresAt, true)}.
            </p>
          </div>
        )}

        <DialogFooter className='gap-2 sm:justify-between'>
          {emailsEnabled ? (
            <Button
              variant='outline'
              disabled={isPending}
              className='cursor-pointer'
              onClick={() =>
                run(() => emailPasswordResetLinkAction(user.id), {
                  success: `Reset link sent to ${user.email}`,
                  refresh: false,
                  onSuccess: () => onOpenChange(false),
                })
              }
            >
              <Mail className='h-4 w-4' />
              Email link to user
            </Button>
          ) : (
            <span />
          )}
          <Button
            disabled={isPending}
            className='cursor-pointer'
            onClick={() =>
              run(() => createPasswordResetLinkAction(user.id), { refresh: false, onSuccess: (data) => setLink(data) })
            }
          >
            {link ? 'Create a new link' : 'Create link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeleteUserDialogProps = {
  user: AdminDialogUser;
  label: string;
  actorUserId: string;
  redirectTo?: string;
  onOpenChange: (open: boolean) => void;
};

function DeleteUserDialog({ user, label, actorUserId, redirectTo, onOpenChange }: DeleteUserDialogProps) {
  const router = useRouter();
  const { run, isPending } = useAdminMutation();
  const [context, setContext] = useState<AdminDeleteUserContext | null>(null);
  const [mode, setMode] = useState<'transfer' | 'delete'>('transfer');
  const [recipientId, setRecipientId] = useState<string>('');
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    let cancelled = false;
    getDeleteUserContextAction(user.id).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        toast.error(result.error.message);
        onOpenChangeRef.current(false);
        return;
      }
      const candidates = result.data.transferCandidates;
      setRecipientId(candidates.find((c) => c.id === actorUserId)?.id ?? candidates[0]?.id ?? '');
      if (!result.data.canTransfer || candidates.length === 0) setMode('delete');
      setContext(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, actorUserId]);

  if (!context) return null;

  const owned = context.ownedDashboards;
  const canTransfer = context.canTransfer && context.transferCandidates.length > 0;
  const transferring = owned.length > 0 && mode === 'transfer';

  const confirm = () => {
    const input = transferring
      ? { ownedDashboards: 'transfer' as const, transferToUserId: recipientId }
      : { ownedDashboards: 'delete' as const };
    run(() => deleteUserAction(user.id, input), {
      success: `${label} was deleted`,
      refresh: !redirectTo,
      onSuccess: () => {
        onOpenChange(false);
        if (redirectTo) router.push(redirectTo);
      },
    });
  };

  return (
    <DestructiveActionDialog
      open
      onOpenChange={onOpenChange}
      title={`Delete ${label}?`}
      description="Their account is anonymized and they can't sign in again. This can't be undone."
      confirmLabel='Delete user'
      pendingLabel='Deleting...'
      cancelLabel='Cancel'
      countdownSeconds={5}
      showIcon
      isPending={isPending}
      onConfirm={confirm}
    >
      {owned.length === 0 ? (
        <p className='text-muted-foreground text-sm'>They don&apos;t own any dashboards.</p>
      ) : (
        <div className='space-y-3 text-sm'>
          <div>
            <p className='font-medium'>
              They own {owned.length} dashboard{owned.length === 1 ? '' : 's'}:
            </p>
            <ul className='text-muted-foreground mt-1 list-disc space-y-0.5 pl-5'>
              {owned.map((dashboard) => (
                <li key={dashboard.dashboardId}>{dashboard.domain}</li>
              ))}
            </ul>
          </div>

          {canTransfer ? (
            <fieldset className='space-y-2'>
              <legend className='sr-only'>What happens to their dashboards</legend>
              <label className='flex cursor-pointer items-start gap-2'>
                <input
                  type='radio'
                  name='owned-dashboards'
                  className='mt-1'
                  checked={mode === 'transfer'}
                  onChange={() => setMode('transfer')}
                />
                <span className='flex-1 space-y-2'>
                  <span className='block'>Transfer them to another user</span>
                  {mode === 'transfer' && (
                    <Select value={recipientId} onValueChange={setRecipientId}>
                      <SelectTrigger className='w-full' aria-label='New owner'>
                        <SelectValue placeholder='Choose the new owner' />
                      </SelectTrigger>
                      <SelectContent>
                        {context.transferCandidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name ? `${candidate.name} (${candidate.email})` : candidate.email}
                            {candidate.id === actorUserId ? ' (you)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </span>
              </label>
              <label className='flex cursor-pointer items-start gap-2'>
                <input
                  type='radio'
                  name='owned-dashboards'
                  className='mt-1'
                  checked={mode === 'delete'}
                  onChange={() => setMode('delete')}
                />
                <span>Delete them with the user</span>
              </label>
            </fieldset>
          ) : (
            <p className='text-destructive'>These dashboards will be deleted with the user.</p>
          )}
        </div>
      )}
    </DestructiveActionDialog>
  );
}
