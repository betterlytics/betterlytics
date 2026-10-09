'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminUserListEntry } from '@/entities/admin/adminUser.entities';
import type { AdminEdition } from '@/entities/admin/adminAccess.entities';
import { cn } from '@/lib/utils';
import {
  getAvatarColor,
  getInitials,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(settings)/settings/members/member-utils';
import { formatDate, formatRelative, userDisplayName } from '@/app/(app)/(protected)/admin/_lib/format';
import { UserRoleBadge, UserStatusBadge } from './UserBadges';
import { UserRowActions } from './UserRowActions';

type UsersTableProps = {
  users: AdminUserListEntry[];
  edition: AdminEdition;
  actorUserId: string;
  emailsEnabled: boolean;
  emptyMessage: string;
};

export function UsersTable({ users, edition, actorUserId, emailsEnabled, emptyMessage }: UsersTableProps) {
  return (
    <div className='bg-card rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='hidden text-right md:table-cell'>Dashboards</TableHead>
            <TableHead className='hidden sm:table-cell'>Last active</TableHead>
            <TableHead className='hidden lg:table-cell'>Joined</TableHead>
            <TableHead className='w-12'>
              <span className='sr-only'>Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className='text-muted-foreground py-10 text-center'>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <UserCell user={user} />
                </TableCell>
                <TableCell>
                  <RoleCell user={user} edition={edition} />
                </TableCell>
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                <TableCell className='hidden text-right tabular-nums md:table-cell'>{user.dashboardCount}</TableCell>
                <TableCell
                  className='text-muted-foreground hidden sm:table-cell'
                  title={user.lastActiveAt ? formatDate(user.lastActiveAt, true) : undefined}
                >
                  {formatRelative(user.lastActiveAt)}
                </TableCell>
                <TableCell className='text-muted-foreground hidden lg:table-cell'>{formatDate(user.createdAt)}</TableCell>
                <TableCell className='text-right'>
                  <UserRowActions
                    user={user}
                    edition={edition}
                    actorUserId={actorUserId}
                    emailsEnabled={emailsEnabled}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function UserCell({ user }: { user: AdminUserListEntry }) {
  const deleted = user.status === 'deleted';
  const name = userDisplayName(user);

  return (
    <Link href={`/admin/users/${user.id}`} className='group flex min-w-0 items-center gap-3'>
      <Avatar className='size-8 shrink-0'>
        <AvatarFallback className={cn('text-xs text-white', deleted ? 'bg-muted-foreground/40' : getAvatarColor(user.email))}>
          {deleted ? '?' : getInitials(user.name || user.email)}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0'>
        <div className='truncate text-sm font-medium group-hover:underline'>
          {name}
          {user.isSelf && <span className='text-muted-foreground ml-1 font-normal'>(you)</span>}
        </div>
        {!deleted && user.name && <div className='text-muted-foreground truncate text-xs'>{user.email}</div>}
      </div>
    </Link>
  );
}

function RoleCell({ user, edition }: { user: AdminUserListEntry; edition: AdminEdition }) {
  if (edition === 'cloud') {
    return user.isSuperAdmin ? <UserRoleBadge label='Super admin' highlighted /> : <UserRoleBadge label='User' highlighted={false} />;
  }
  return user.role === 'admin' ? <UserRoleBadge label='Admin' highlighted /> : <UserRoleBadge label='User' highlighted={false} />;
}
