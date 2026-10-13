import { Suspense } from 'react';
import { getAuditLogAction } from '@/actions/admin/auditLog.action';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminPage } from '@/app/(app)/(protected)/admin/_components/AdminPage';
import { AdminPagination } from '@/app/(app)/(protected)/admin/_components/AdminPagination';
import { LocalDate } from '@/app/(app)/(protected)/admin/_components/LocalDate';
import { describeAuditAction, parsePage } from '@/app/(app)/(protected)/admin/_lib/format';
import { requireAdminPage } from '@/app/(app)/(protected)/admin/_lib/guard';

type AuditLogPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminAuditLogPage({ searchParams }: AuditLogPageProps) {
  await requireAdminPage('audit-log');
  const { page: pageParam } = await searchParams;
  const result = await getAuditLogAction(parsePage(pageParam));
  if (!result.success) throw new Error(result.error.message);
  const { entries, total, page, pageSize, totalPages } = result.data;

  return (
    <AdminPage width='wide' title='Audit log' description='Every action taken in this admin panel.'>
      <div className='bg-card rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-muted-foreground py-10 text-center'>
                  No admin actions yet.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className='text-muted-foreground whitespace-nowrap'>
                    <LocalDate date={entry.createdAt} includeTime />
                  </TableCell>
                  <TableCell className='text-sm'>{entry.actorLabel ?? entry.actorUserId}</TableCell>
                  <TableCell className='text-sm'>{describeAuditAction(entry.action, entry.payload)}</TableCell>
                  <TableCell className='text-muted-foreground max-w-56 truncate text-sm'>
                    {entry.targetLabel ?? (entry.targetType === 'user' ? 'Deleted user' : (entry.targetId ?? '-'))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === 'success' ? 'outline' : 'destructive'}>
                      {entry.status === 'success' ? 'Success' : 'Failed'}
                    </Badge>
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
    </AdminPage>
  );
}
