'use client';

import { useState, useMemo, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RoleBadge, getInitials, formatDate, getAvatarColor } from './member-utils';
import { updateMemberRoleAction, removeMemberAction } from '@/app/actions/dashboard/members.action';
import { DashboardMember } from '@/entities/dashboard/invitation.entities';
import { DashboardRole } from '@prisma/client';
import { useTranslations } from 'next-intl';

type SortField = 'name' | 'email' | 'role' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface MembersTableProps {
  dashboardId: string;
  members: DashboardMember[];
  currentUserId: string;
}

export function MembersTable({ dashboardId, members, currentUserId }: MembersTableProps) {
  const t = useTranslations('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('role');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isPending, startTransition] = useTransition();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = members.filter(
        (member) =>
          member.user.name?.toLowerCase().includes(query) || member.user.email?.toLowerCase().includes(query),
      );
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.user.name || '').localeCompare(b.user.name || '');
          break;
        case 'email':
          comparison = (a.user.email || '').localeCompare(b.user.email || '');
          break;
        case 'role':
          const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
          comparison = roleOrder[a.role] - roleOrder[b.role];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [members, searchQuery, sortField, sortDirection]);

  const handleChangeRole = (userId: string, newRole: DashboardRole) => {
    startTransition(async () => {
      try {
        await updateMemberRoleAction(dashboardId, userId, newRole);
        toast.success(t('toast.roleUpdated'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.roleUpdateFailed'));
      }
    });
  };

  const handleRemoveMember = (userId: string) => {
    startTransition(async () => {
      try {
        await removeMemberAction(dashboardId, userId);
        toast.success(t('toast.memberRemoved'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.memberRemoveFailed'));
      }
    });
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button variant='ghost' size='sm' className='-ml-3 h-8 font-medium' onClick={() => handleSort(field)}>
      {children}
      <ArrowUpDown className='ml-1 size-3' />
    </Button>
  );

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <CardTitle className='text-base'>
          {t('table.title')} ({members.length})
        </CardTitle>
        <div className='relative w-64'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            placeholder={t('table.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-4'>
                  <SortableHeader field='name'>{t('table.columns.member')}</SortableHeader>
                </TableHead>
                <TableHead className='hidden md:table-cell'>
                  <SortableHeader field='email'>{t('table.columns.email')}</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field='role'>{t('table.columns.role')}</SortableHeader>
                </TableHead>
                <TableHead className='hidden sm:table-cell'>
                  <SortableHeader field='createdAt'>{t('table.columns.joined')}</SortableHeader>
                </TableHead>
                <TableHead className='w-12'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='py-8 text-center'>
                    {t('table.noResults', { query: searchQuery })}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className='py-3 pl-4'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='size-8'>
                          {member.user.image && (
                            <AvatarImage src={member.user.image} alt={member.user.name || ''} />
                          )}
                          <AvatarFallback className={`${getAvatarColor(member.user.email)} text-xs text-white`}>
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>
                            {member.user.name || t('table.unknown')}
                            {member.userId === currentUserId && (
                              <span className='text-muted-foreground ml-1.5 text-xs font-normal'>
                                {t('table.you')}
                              </span>
                            )}
                          </p>
                          <p className='text-muted-foreground text-xs md:hidden'>{member.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden py-3 md:table-cell'>
                      {member.user.email}
                    </TableCell>
                    <TableCell className='py-3'>
                      <RoleBadge role={member.role} />
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden py-3 sm:table-cell'>
                      {formatDate(member.createdAt)}
                    </TableCell>
                    <TableCell className='py-3'>
                      {member.role !== 'owner' && member.userId !== currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='size-8' disabled={isPending}>
                              <MoreHorizontal className='size-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>{t('actions.changeRole')}</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {member.role !== 'admin' && (
                                  <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'admin')}>
                                    {t('roles.admin')}
                                  </DropdownMenuItem>
                                )}
                                {member.role !== 'member' && (
                                  <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'member')}>
                                    {t('roles.member')}
                                  </DropdownMenuItem>
                                )}
                                {member.role !== 'viewer' && (
                                  <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'viewer')}>
                                    {t('roles.viewer')}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='text-destructive focus:text-destructive'
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              {t('actions.removeFromDashboard')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
