import { Suspense } from 'react';
import { getBugReportsAction } from '@/actions/superadmin/bugReports.action';
import { AdminPagination } from '../_components/AdminPagination';
import { BugReportStatusButtons } from './_components/BugReportStatusButtons';
import { ViewMessageDialog } from './_components/ViewMessageDialog';
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
import type { BugReportStatus } from '@prisma/client';

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

const STATUS_FILTERS: { label: string; value: BugReportStatus | 'all' }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Ignored', value: 'ignored' },
  { label: 'All', value: 'all' },
];

function statusBadgeProps(status: BugReportStatus): { variant: 'secondary' | 'outline'; className?: string } {
  if (status === 'resolved') return { variant: 'outline', className: 'border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 dark:border-green-800' };
  if (status === 'ignored') return { variant: 'secondary' };
  return { variant: 'outline' };
}

function truncate(text: string, length = 80) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function parseStatusFilter(raw: string | undefined): BugReportStatus | 'all' {
  if (raw === 'resolved' || raw === 'ignored' || raw === 'open' || raw === 'all') return raw;
  return 'open';
}

export default async function AdminBugReportsPage({ searchParams }: PageProps) {
  const { page: pageStr, status: statusStr } = await searchParams;
  const page = parsePage(pageStr);
  const activeFilter = parseStatusFilter(statusStr);

  const result = await getBugReportsAction(page, activeFilter === 'all' ? undefined : activeFilter);
  if (!result.success) throw new Error(result.error.message);
  const { reports, total, totalPages, pageSize } = result.data;

  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold mb-1'>Bug Reports</h1>
        <p className='text-muted-foreground text-sm'>
          {total} {activeFilter === 'all' ? 'total' : activeFilter} reports
        </p>
      </div>

      <div className='flex gap-2 mb-4'>
        {STATUS_FILTERS.map(({ label, value }) => {
          const href = value === 'open' ? '?' : `?status=${value}`;
          const isActive = activeFilter === value;
          return (
            <a
              key={value}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      <div className='rounded-md border'>
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
                <TableCell colSpan={6} className='text-center py-10 text-muted-foreground'>
                  No bug reports
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className='font-medium'>{report.userEmail}</TableCell>
                  <TableCell className='text-muted-foreground max-w-sm'>{truncate(report.message)}</TableCell>
                  <TableCell className='text-muted-foreground font-mono text-xs'>
                    {report.dashboardId ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge {...statusBadgeProps(report.status)}>{report.status}</Badge>
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
    </div>
  );
}
