'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { enableUserAction } from '@/actions/admin/users.action';
import type { AdminUserListEntry } from '@/entities/admin/adminUser.entities';
import type { AdminEdition } from '@/entities/admin/adminAccess.entities';
import { userDisplayName } from '@/app/(app)/(protected)/admin/_lib/format';
import { UserActionDialogs, type AdminUserDialog } from './UserActionDialogs';
import { useAdminMutation } from './useAdminMutation';

type UserRowActionsProps = {
  user: AdminUserListEntry;
  edition: AdminEdition;
  actorUserId: string;
  emailsEnabled: boolean;
};

export function UserRowActions({ user, edition, actorUserId, emailsEnabled }: UserRowActionsProps) {
  const [dialog, setDialog] = useState<AdminUserDialog | null>(null);
  const { run } = useAdminMutation();
  const label = userDisplayName(user);
  const can = (action: keyof AdminUserListEntry['actions']) => user.actions[action] === null;

  const showRoleChange = edition === 'selfhost' && user.status !== 'deleted' && can('change_role');
  const showReset = user.status === 'active' && (can('reset_password') || can('reset_two_factor'));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='size-8 cursor-pointer'
            aria-label={`Actions for ${label}`}
          >
            <MoreHorizontal className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href={`/admin/users/${user.id}`}>View details</Link>
          </DropdownMenuItem>

          {showRoleChange && (
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={() => setDialog(user.role === 'admin' ? 'demote' : 'promote')}
            >
              {user.role === 'admin' ? 'Remove admin' : 'Make admin'}
            </DropdownMenuItem>
          )}

          {showReset && (
            <>
              <DropdownMenuSeparator />
              {can('reset_password') && user.hasPassword && (
                <DropdownMenuItem className='cursor-pointer' onClick={() => setDialog('reset-password')}>
                  Reset password...
                </DropdownMenuItem>
              )}
              {can('reset_two_factor') && user.twoFactorEnabled && (
                <DropdownMenuItem className='cursor-pointer' onClick={() => setDialog('reset-two-factor')}>
                  Reset two-factor...
                </DropdownMenuItem>
              )}
            </>
          )}

          {user.status === 'disabled' && can('enable') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='cursor-pointer'
                onClick={() => run(() => enableUserAction(user.id), { success: `${label} was enabled` })}
              >
                Enable
              </DropdownMenuItem>
            </>
          )}

          {user.status !== 'deleted' && (can('disable') || can('delete')) && (
            <>
              <DropdownMenuSeparator />
              {user.status === 'active' && can('disable') && (
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive cursor-pointer'
                  onClick={() => setDialog('disable')}
                >
                  Disable...
                </DropdownMenuItem>
              )}
              {can('delete') && (
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive cursor-pointer'
                  onClick={() => setDialog('delete')}
                >
                  Delete...
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserActionDialogs
        user={user}
        dialog={dialog}
        onClose={() => setDialog(null)}
        actorUserId={actorUserId}
        emailsEnabled={emailsEnabled}
      />
    </>
  );
}
