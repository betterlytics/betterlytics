import { Suspense } from 'react';
import { getUsersAction } from '@/actions/superadmin/users.action';
import { AdminPagination } from '../_components/AdminPagination';
import { SearchInput } from '../_components/SearchInput';
import { DeleteUserButton } from './_components/DeleteUserButton';
import { formatDate, parsePage } from '../_lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { search, page: pageStr } = await searchParams;
  const page = parsePage(pageStr);

  const result = await getUsersAction(search, page);
  if (!result.success) throw new Error(result.error.message);
  const { users, total, totalPages, pageSize } = result.data;

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-semibold mb-1'>Users</h1>
          <p className='text-muted-foreground text-sm'>{total} total users</p>
        </div>
        <Suspense>
          <SearchInput placeholder='Search by email or name...' />
        </Suspense>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={user.deletedAt ? 'opacity-60' : undefined}>
                  <TableCell className='font-medium'>{user.email}</TableCell>
                  <TableCell className='text-muted-foreground'>{user.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role ?? 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.totpEnabled ? 'default' : 'outline'}>
                      {user.totpEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.deletedAt ? (
                      <Badge variant='destructive'>Deleted</Badge>
                    ) : (
                      <Badge variant='outline'>Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className='text-right'>
                    {!user.deletedAt && <DeleteUserButton userId={user.id} userEmail={user.email} />}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Suspense>
        <AdminPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
