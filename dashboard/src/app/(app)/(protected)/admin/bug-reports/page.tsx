import { Suspense } from 'react';
import Link from 'next/link';
import type { BugReportStatus } from '@prisma/client';
import { getBugReportsAction } from '@/actions/admin/bugReports.action';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AdminPage } from '@/app/(app)/(protected)/admin/_components/AdminPage';
import { AdminPagination } from '@/app/(app)/(protected)/admin/_components/AdminPagination';
import { formatDate, parsePage } from '@/app/(app)/(protected)/admin/_lib/format';
import { requireAdminPage } from '@/app/(app)/(protected)/admin/_lib/guard';
import { BugReportStatusButtons } from './_components/BugReportStatusButtons';
import { ViewMessageDialog } from './_components/ViewMessageDialog';

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

const STATUS_FILTERS: { label: string; value: BugReportStatus | 'all' }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Ignored', value: 'ignored' },
  { label: 'All', value: 'all' },
];

function statusBadgeVariant(status: BugReportStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'resolved') return 'default';
  if (status === 'ignored') return 'secondary';
  return 'outline';
}

function truncate(text: string, length = 80) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function parseStatusFilter(raw: string | undefined): BugReportStatus | 'all' {
  if (raw === 'open' || raw === 'resolved' || raw === 'ignored' || raw === 'all') return raw;
  return 'open';
}

export default async function AdminBugReportsPage({ searchParams }: PageProps) {
  await requireAdminPage('bug-reports');

  const { page: pageStr, status: statusStr } = await searchParams;
  const activeFilter = parseStatusFilter(statusStr);

  const result = await getBugReportsAction(parsePage(pageStr), activeFilter === 'all' ? undefined : activeFilter);
  if (!result.success) throw new Error(result.error.message);
  const { reports, total, page, totalPages, pageSize } = result.data;

  return (
    <AdminPage
      width='wide'
      title='Bug reports'
      description={`${total} ${activeFilter === 'all' ? 'total' : activeFilter} reports`}
    >
      <nav aria-label='Filter bug reports' className='bg-muted/50 mb-4 inline-flex rounded-md border p-0.5'>
        {STATUS_FILTERS.map(({ label, value }) => {
          const isActive = activeFilter === value;
          return (
            <Link
              key={value}
              href={value === 'open' ? '/admin/bug-reports' : `/admin/bug-reports?status=${value}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'rounded px-3 py-1 text-sm font-medium transition-colors',
                isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className='bg-card rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Dashboard</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-muted-foreground py-10 text-center'>
                  No bug reports
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className='font-medium'>{report.userEmail}</TableCell>
                  <TableCell className='text-muted-foreground max-w-sm'>{truncate(report.message)}</TableCell>
                  <TableCell className='text-muted-foreground font-mono text-xs'>{report.dashboardId ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(report.status)}>{report.status}</Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{formatDate(report.createdAt)}</TableCell>
                  <TableCell>
                    <div className='flex items-center justify-end gap-1'>
                      <ViewMessageDialog title='Bug Report' message={report.message} />
                      <BugReportStatusButtons reportId={report.id} currentStatus={report.status} />
                    </div>
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
