import { Suspense } from 'react';
import { getAuditLogAction } from '@/actions/superadmin/auditLog.action';
import { AdminPagination } from '../_components/AdminPagination';
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
  searchParams: Promise<{ page?: string }>;
}

function actionVariant(action: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (action.startsWith('delete_')) return 'destructive';
  if (action.startsWith('create_') || action.startsWith('add_')) return 'default';
  return 'secondary';
}

export default async function AdminAuditLogPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = parsePage(pageStr);

  const result = await getAuditLogAction(page);
  if (!result.success) throw new Error(result.error.message);
  const { entries, total, totalPages, pageSize } = result.data;

  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold mb-1'>Audit Log</h1>
        <p className='text-muted-foreground text-sm'>{total} total entries</p>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Payload</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-10 text-muted-foreground'>
                  No audit log entries
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className='font-mono text-xs text-muted-foreground'>{entry.actorUserId}</TableCell>
                  <TableCell>
                    <Badge variant={actionVariant(entry.action)}>{entry.action}</Badge>
                  </TableCell>
                  <TableCell className='text-sm'>
                    <span className='text-muted-foreground'>{entry.targetType}</span>
                    {entry.targetId && (
                      <span className='font-mono text-xs text-muted-foreground ml-1'>
                        #{entry.targetId.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='font-mono text-xs text-muted-foreground max-w-xs truncate'>
                    {Object.keys(entry.payload).length > 0 ? JSON.stringify(entry.payload) : '—'}
                  </TableCell>
                  <TableCell className='text-muted-foreground text-sm whitespace-nowrap'>
                    {formatDate(entry.createdAt, true)}
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
